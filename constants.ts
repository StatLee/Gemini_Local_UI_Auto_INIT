
import { GPUProfile, AppConfig } from './types';

export const DEFAULT_CONFIG: AppConfig = {
  gpuProfile: GPUProfile.MID, // Targeting 4060 Ti
  features: {
    textToImage: true,
    imageToVideo: true,
    documentUpload: true,
    webSearch: true,
    deepThinking: true,
  },
  llmProvider: 'gemini',
};

// STRICT VERSION PINNING to resolve Windows/Python 3.10+ conflicts
// User identified fix: Streamlit 1.28 (supports chat UI) + Altair < 5 + Tornado 6.1 (prevents crash)
export const REQUIREMENTS_TEMPLATE = `
langchain==0.3.0
langchain-community==0.3.0
langchain-core==0.3.0
langchain-google-genai
streamlit==1.28.0
altair<5
tornado==6.1
python-dotenv
google-genai
pillow
duckduckgo-search
pypdf
faiss-cpu
tiktoken
watchdog
typing-extensions>=4.9.0
protobuf
`;

// Wrapper to bypass execution policy for installation
export const BAT_INSTALL_TEMPLATE = `
@echo off
echo Starting NeuroDeploy Installer...
PowerShell -NoProfile -ExecutionPolicy Bypass -Command "& './install_langchain.ps1'"
pause
`;

// Wrapper to bypass execution policy for running the app
export const BAT_RUN_TEMPLATE = `
@echo off
echo Launching App...
PowerShell -NoProfile -ExecutionPolicy Bypass -Command "& './run_app.ps1'"
pause
`;

// Wrapper to bypass execution policy for rollback
export const BAT_ROLLBACK_TEMPLATE = `
@echo off
echo Starting Rollback/Cleanup...
PowerShell -NoProfile -ExecutionPolicy Bypass -Command "& './rollback.ps1'"
pause
`;

export const INSTALL_SCRIPT_TEMPLATE = (config: AppConfig) => `
# NeuroDeploy - LangChain Suite Installer
# Target Profile: ${config.gpuProfile} (RTX 4060 Ti Optimized)

# Ensure we are running in the script's directory
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $ScriptDir

Write-Host "Starting NeuroDeploy Installation..." -ForegroundColor Cyan

# 1. Check Python
try {
    $pythonVersion = python --version 2>&1
    if ($pythonVersion -match "Python 3") {
        Write-Host "Found $pythonVersion" -ForegroundColor Green
    } else {
        throw "Python 3 not found"
    }
} catch {
    Write-Host "Python 3.10+ is required. Please install from python.org" -ForegroundColor Red
    Pause
    Exit
}

# 2. Create Virtual Environment
if (-not (Test-Path ".venv")) {
    Write-Host "Creating virtual environment (.venv)..." -ForegroundColor Yellow
    python -m venv .venv
} else {
    Write-Host "Virtual environment already exists." -ForegroundColor Gray
}

# 3. Activate
Write-Host "Activating environment..." -ForegroundColor Yellow
Invoke-Expression ".\\.venv\\Scripts\\Activate.ps1"

# Upgrade pip
python -m pip install --upgrade pip

# 4. Check/Create requirements.txt (Self-healing)
Write-Host "Writing strict version requirements (Streamlit 1.28/Altair<5/Tornado 6.1)..." -ForegroundColor Yellow
$reqContent = @"
${REQUIREMENTS_TEMPLATE}
"@
$reqContent | Out-File "requirements.txt" -Encoding utf8


# 5. Install Dependencies (With Clean Slate Logic)
Write-Host "Installing LangChain ecosystem..." -ForegroundColor Cyan

# Force uninstall potentially conflicting versions first if they exist
# This is critical to ensure Tornado 6.1 is actually the one used
pip uninstall -y streamlit tornado altair typeguard

# Install from requirements
pip install -r requirements.txt

Write-Host "Verifying Versions..." -ForegroundColor Magenta
pip show streamlit
pip show tornado
pip show altair

# 6. Setup Environment Variables
if (-not (Test-Path ".env")) {
    Write-Host "Creating .env file template..." -ForegroundColor Yellow
    "GOOGLE_API_KEY=" | Out-File ".env" -Encoding utf8
    "LANGCHAIN_TRACING_V2=false" | Out-File ".env" -Append -Encoding utf8
    Write-Host "ALERT: Please edit the .env file with your GOOGLE_API_KEY!" -ForegroundColor Magenta
}

Write-Host "Installation Complete!" -ForegroundColor Green
Write-Host "To launch the app, double-click 'start.bat'" -ForegroundColor Cyan
`;

export const RUN_SCRIPT_TEMPLATE = `
# NeuroDeploy Launcher
$ScriptDir = Split-Path $MyInvocation.MyCommand.Path
Set-Location $ScriptDir

Write-Host "Launching LangChain Suite..." -ForegroundColor Cyan

if (Test-Path ".venv") {
    Invoke-Expression ".\\.venv\\Scripts\\Activate.ps1"
    streamlit run app.py
} else {
    Write-Host "Error: Virtual environment not found. Please run setup.bat first." -ForegroundColor Red
    Pause
}
`;

export const ROLLBACK_SCRIPT_TEMPLATE = `
# NeuroDeploy Uninstaller / Rollback
$ScriptDir = Split-Path $MyInvocation.MyCommand.Path
Set-Location $ScriptDir

Write-Host "WARNING: This will delete the virtual environment and all cached data." -ForegroundColor Red
$confirmation = Read-Host "Are you sure you want to proceed? (y/n)"

if ($confirmation -eq 'y') {
    Write-Host "Removing virtual environment..." -ForegroundColor Yellow
    if (Test-Path ".venv") { Remove-Item -Recurse -Force ".venv" }
    
    Write-Host "Removing cache files..." -ForegroundColor Yellow
    Get-ChildItem -Recurse -Include __pycache__, .streamlit, *.pyc | Remove-Item -Recurse -Force -ErrorAction SilentlyContinue
    
    Write-Host "Clean up complete. The 'app.py' and configuration files were preserved." -ForegroundColor Green
} else {
    Write-Host "Operation cancelled."
}
Pause
`;

export const PYTHON_APP_TEMPLATE = (config: AppConfig) => `
import streamlit as st
import os
import tempfile
import base64
from dotenv import load_dotenv
from google import genai
from google.genai import types
from langchain_google_genai import ChatGoogleGenerativeAI, GoogleGenerativeAIEmbeddings
from langchain_community.document_loaders import PyPDFLoader, TextLoader
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_community.vectorstores import FAISS
from langchain_community.tools import DuckDuckGoSearchResults
from langchain_community.utilities import DuckDuckGoSearchAPIWrapper
from langchain_core.messages import HumanMessage, AIMessage

# Load Environment
load_dotenv()

# Page Config
st.set_page_config(
    page_title="NeuroDeploy Suite",
    page_icon="🧠",
    layout="wide",
    initial_sidebar_state="expanded"
)

# Custom CSS
st.markdown("""
    <style>
    .stChatInput { padding-bottom: 20px; }
    .stButton button { width: 100%; }
    </style>
""", unsafe_allow_html=True)

# --- Sidebar Configuration ---
st.sidebar.title("⚙️ Config")

api_key = os.getenv("GOOGLE_API_KEY")
if not api_key:
    api_key = st.sidebar.text_input("Enter Google API Key", type="password")
    os.environ["GOOGLE_API_KEY"] = api_key

# Models
model_options = [
    "gemini-2.0-flash",
    "gemini-2.0-flash-thinking-exp-01-21",
    "gemini-2.0-pro-exp-02-05",
    "gemini-1.5-pro"
]
model_type = st.sidebar.selectbox("Model", model_options, index=0)
temperature = st.sidebar.slider("Temperature", 0.0, 1.0, 0.7)

st.sidebar.divider()

# NAVIGATION SYSTEM
# Replaces Tabs to fix st.chat_input nesting error
app_mode = st.sidebar.radio("Navigation", ["💬 Multimodal Chat", "📚 Document RAG", "🎨 Media Studio"])

st.sidebar.divider()
# FIXED: Added $ for correct string interpolation of the GPU profile
st.sidebar.info(f"GPU Mode: ${config.gpuProfile}\\nStatus: Optimized for 4060 Ti\\n(VRAM saved for system)")

# --- State Management ---
if "messages" not in st.session_state:
    st.session_state.messages = []
if "vector_store" not in st.session_state:
    st.session_state.vector_store = None

# --- Logic Helpers ---
def get_llm():
    if not api_key:
        st.error("Please provide an API Key.")
        return None
    return ChatGoogleGenerativeAI(
        model=model_type,
        temperature=temperature,
        google_api_key=api_key,
        convert_system_message_to_human=True
    )

def perform_web_search(query):
    wrapper = DuckDuckGoSearchAPIWrapper(max_results=5)
    search = DuckDuckGoSearchResults(api_wrapper=wrapper)
    return search.run(query)

def process_documents(uploaded_files):
    docs = []
    if not uploaded_files:
        return None
    
    # Use st.expander for status in older streamlit versions if st.status is missing, 
    # but 1.28 has st.status
    try:
        status_container = st.status("Processing Documents...", expanded=True)
    except AttributeError:
        status_container = st.empty()
        status_container.info("Processing Documents...")
    
    for file in uploaded_files:
        with tempfile.NamedTemporaryFile(delete=False, suffix=f".{file.name.split('.')[-1]}") as tmp:
            tmp.write(file.getvalue())
            tmp_path = tmp.name
        
        try:
            if file.type == "application/pdf":
                loader = PyPDFLoader(tmp_path)
                docs.extend(loader.load())
            elif file.type == "text/plain":
                loader = TextLoader(tmp_path)
                docs.extend(loader.load())
        finally:
            os.unlink(tmp_path)
    
    # Update status text if possible
    try:
        status_container.write("Splitting text...")
    except:
        pass
    
    text_splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=200)
    splits = text_splitter.split_documents(docs)
    
    # status.write("Embedding (Google Cloud)...")
    embeddings = GoogleGenerativeAIEmbeddings(model="models/text-embedding-004", google_api_key=api_key)
    vector_store = FAISS.from_documents(splits, embeddings)
    
    try:
        status_container.update(label="Knowledge Base Ready!", state="complete", expanded=False)
    except:
        status_container.success("Knowledge Base Ready!")
        
    return vector_store

def encode_image(image_file):
    return base64.b64encode(image_file.getvalue()).decode("utf-8")

# --- Main UI ---
st.title("🧠 NeuroDeploy Workspace")

# === PAGE 1: CHAT ===
if app_mode == "💬 Multimodal Chat":
    st.subheader("Chat with Deep Reasoning")
    
    # Setup Tools in Sidebar to avoid nesting issues in main area
    st.sidebar.markdown("### 🛠️ Chat Tools")
    enable_search = st.sidebar.checkbox("Auto-Web Search", value=False)
    uploaded_media = st.sidebar.file_uploader("Add Image/Video", type=['png', 'jpg', 'jpeg', 'mp4'], key="chat_media")
    
    if st.sidebar.button("Clear Chat"):
        st.session_state.messages = []
        st.rerun()

    # Display Chat
    for msg in st.session_state.messages:
        with st.chat_message(msg["role"]):
            if "image_data" in msg:
                st.image(base64.b64decode(msg["image_data"]), width=300)
            st.markdown(msg["content"])

    # Chat Input (Must be at root level of the script/page conditional)
    if prompt := st.chat_input("Ask anything..."):
        # Prepare User Message
        user_content = [{"type": "text", "text": prompt}]
        msg_display = {"role": "user", "content": prompt}
        
        # Handle Media Input
        if uploaded_media:
            mime_type = uploaded_media.type
            b64_data = encode_image(uploaded_media)
            
            if "image" in mime_type:
                user_content.append({
                    "type": "image_url", 
                    "image_url": f"data:{mime_type};base64,{b64_data}"
                })
                msg_display["image_data"] = b64_data
            else:
                    # For video, simpler to just note it for now or use direct text
                    user_content.append({"type": "text", "text": "[Video uploaded - processing context]"})
        
        st.session_state.messages.append(msg_display)
        
        with st.chat_message("user"):
            if "image_data" in msg_display:
                st.image(base64.b64decode(msg_display["image_data"]), width=300)
            st.markdown(prompt)

        with st.chat_message("assistant"):
            llm = get_llm()
            if llm:
                response_placeholder = st.empty()
                context_text = ""
                
                # Handle Web Search
                if enable_search or "@search" in prompt:
                    with st.spinner("Searching the web..."):
                        search_q = prompt.replace("@search", "").strip()
                        search_res = perform_web_search(search_q)
                        context_text += f"\\nWEB SEARCH RESULTS:\\n{search_res}\\n"
                        st.markdown(f"**🔎 Search Results:**\\n{search_res[:200]}...")
                
                # Handle RAG Context
                if st.session_state.vector_store:
                    retriever = st.session_state.vector_store.as_retriever()
                    relevant_docs = retriever.invoke(prompt)
                    doc_texts = "\\n".join([d.page_content for d in relevant_docs])
                    context_text += f"\\nDOCUMENT CONTEXT:\\n{doc_texts}\\n"
                    with st.expander("View Retrieved Context"):
                        st.text(doc_texts[:500] + "...")

                if context_text:
                    user_content[0]["text"] = f"Context: {context_text}\\n\\nQuestion: {prompt}"

                # Invoke
                try:
                    # Construct HumanMessage for LangChain
                    lc_msg = HumanMessage(content=user_content)
                    response = llm.invoke([lc_msg])
                    
                    st.markdown(response.content)
                    st.session_state.messages.append({"role": "assistant", "content": response.content})
                except Exception as e:
                    st.error(f"Error: {e}")

# === PAGE 2: RAG ===
elif app_mode == "📚 Document RAG":
    st.subheader("Knowledge Base (RAG)")
    st.markdown("Upload documents to chat with them. Uses **Google Embeddings** to save VRAM.")
    
    uploaded_files = st.file_uploader("Upload PDF or TXT", accept_multiple_files=True, type=['pdf', 'txt'])
    
    if uploaded_files and st.button("Process Documents"):
        st.session_state.vector_store = process_documents(uploaded_files)
        try:
             st.rerun()
        except AttributeError:
             st.experimental_rerun()
    
    if st.session_state.vector_store:
        st.success("✅ Knowledge Base is Active! Go to 'Multimodal Chat' to ask questions.")

# === PAGE 3: MEDIA ===
elif app_mode == "🎨 Media Studio":
    st.subheader("Generative Media Studio")
    st.caption("Powered by Imagen 3 & Veo (via Google GenAI SDK)")
    
    m_col1, m_col2 = st.columns(2)
    
    with m_col1:
        st.markdown("### 🖼️ Text to Image")
        img_prompt = st.text_area("Image Prompt", "A futuristic city with flying cars, cyberpunk style")
        aspect_ratio = st.selectbox("Aspect Ratio", ["1:1", "16:9", "9:16", "4:3"])
        
        if st.button("Generate Image"):
            if not api_key:
                st.error("API Key required")
            else:
                try:
                    client = genai.Client(api_key=api_key)
                    with st.spinner("Generating with Imagen 3..."):
                        response = client.models.generate_images(
                            model='imagen-3.0-generate-001',
                            prompt=img_prompt,
                            config=types.GenerateImagesConfig(
                                number_of_images=1,
                                aspect_ratio=aspect_ratio
                            )
                        )
                        if response.generated_images:
                            img_data = response.generated_images[0].image.image_bytes
                            st.image(img_data, caption=img_prompt)
                            st.session_state['last_generated_image'] = img_data
                        else:
                            st.error("No image returned.")
                except Exception as e:
                    st.error(f"Generation failed: {str(e)}")

    with m_col2:
        st.markdown("### 🎥 Image to Video")
        video_source = st.radio("Source", ["Upload Image", "Use Generated Image"])
        input_image_bytes = None
        
        if video_source == "Upload Image":
            vid_upload = st.file_uploader("Upload Source Image", type=['png', 'jpg'])
            if vid_upload:
                input_image_bytes = vid_upload.getvalue()
                st.image(vid_upload, width=200)
        else:
            if 'last_generated_image' in st.session_state:
                input_image_bytes = st.session_state['last_generated_image']
                st.image(input_image_bytes, width=200, caption="Source")
            else:
                st.warning("Generate an image first.")

        vid_prompt = st.text_input("Motion Prompt", "Pan camera right, cinematic lighting")
        
        if st.button("Generate Video (Veo)"):
            if not input_image_bytes:
                st.error("No image selected.")
            elif not api_key:
                st.error("API Key required")
            else:
                try:
                    client = genai.Client(api_key=api_key)
                    with st.spinner("Dreaming up video (this takes time)..."):
                        # Ensure mime_type is correct or generic
                        operation = client.models.generate_videos(
                            model='veo-2.0-generate-001', 
                            prompt=vid_prompt,
                            image=types.Image(
                                image_bytes=input_image_bytes,
                                mime_type='image/png'
                            ),
                            config=types.GenerateVideosConfig(
                                number_of_videos=1
                            )
                        )
                        import time
                        while not operation.done:
                            time.sleep(5)
                            operation = client.operations.get_operation(name=operation.name)
                        
                        if operation.response and operation.response.generated_videos:
                            vid_uri = operation.response.generated_videos[0].video.uri
                            st.success("Video Generated!")
                            st.video(vid_uri) 
                        else:
                            st.error("Video generation completed but no output found.")
                except Exception as e:
                    st.error(f"Video failed: {str(e)}")
`;

