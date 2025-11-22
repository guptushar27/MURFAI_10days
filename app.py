import streamlit as st
import requests
import os
import base64
import tempfile
import numpy as np
import matplotlib.pyplot as plt
from audiorecorder import audiorecorder
from io import BytesIO
import google.generativeai as genai

st.set_page_config(
    page_title="Voice Chat with Murf AI",
    page_icon="🎙️",
    layout="centered"
)

st.markdown("""
    <style>
    .stApp {
        background-color: #0e1117;
    }
    .chat-message {
        padding: 1.5rem;
        border-radius: 0.5rem;
        margin-bottom: 1rem;
        display: flex;
        flex-direction: column;
    }
    .user-message {
        background-color: #1f2937;
        border-left: 4px solid #3b82f6;
    }
    .assistant-message {
        background-color: #1a1f2e;
        border-left: 4px solid #10b981;
    }
    .message-label {
        font-weight: bold;
        margin-bottom: 0.5rem;
        color: #9ca3af;
        font-size: 0.875rem;
        text-transform: uppercase;
        letter-spacing: 0.05em;
    }
    .message-content {
        color: #e5e7eb;
        font-size: 1rem;
        line-height: 1.5;
    }
    h1 {
        color: #f9fafb;
        text-align: center;
        padding: 1rem 0;
        font-size: 2.5rem;
    }
    h3 {
        color: #d1d5db;
    }
    .stButton > button {
        background-color: #3b82f6;
        color: white;
        border: none;
        border-radius: 0.5rem;
        padding: 0.75rem 2rem;
        font-size: 1rem;
        font-weight: 600;
        transition: all 0.3s;
        width: 100%;
    }
    .stButton > button:hover {
        background-color: #2563eb;
        box-shadow: 0 4px 6px rgba(59, 130, 246, 0.3);
    }
    .stTextInput > div > div > input {
        background-color: #1f2937;
        color: #f9fafb;
        border: 1px solid #374151;
        border-radius: 0.5rem;
    }
    .stSelectbox > div > div > div {
        background-color: #1f2937;
        color: #f9fafb;
        border: 1px solid #374151;
    }
    .recording-indicator {
        color: #ef4444;
        font-weight: bold;
        text-align: center;
        padding: 1rem;
        animation: pulse 1.5s infinite;
    }
    @keyframes pulse {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.5; }
    }
    .status-success {
        color: #10b981;
        font-size: 0.875rem;
        padding: 0.5rem;
        text-align: center;
    }
    .status-error {
        color: #ef4444;
        font-size: 0.875rem;
        padding: 0.5rem;
        text-align: center;
    }
    </style>
""", unsafe_allow_html=True)

# Initialize Gemini AI client
# Using Gemini 2.0 Flash for fast, intelligent responses
def get_gemini_client():
    api_key = os.getenv("GOOGLE_API_KEY")
    if not api_key:
        return None
    genai.configure(api_key=api_key)
    return True

def transcribe_audio(audio_data):
    """Transcribe audio using Gemini AI"""
    if not get_gemini_client():
        st.error("GOOGLE_API_KEY not found. Please provide it to enable speech-to-text.")
        return None
    
    try:
        # Save audio to temporary file
        with tempfile.NamedTemporaryFile(delete=False, suffix=".wav") as tmp_file:
            audio_data.export(tmp_file.name, format="wav")
            tmp_file_path = tmp_file.name
        
        # Upload and transcribe using Gemini
        with open(tmp_file_path, "rb") as audio_file:
            with st.spinner("Transcribing audio..."):
                audio_content = audio_file.read()
                model = genai.GenerativeModel('gemini-2.0-flash')
                response = model.generate_content([
                    "Please transcribe the following audio. Return only the transcribed text without any additional commentary.",
                    {"mime_type": "audio/wav", "data": audio_content}
                ])
        
        # Clean up temp file
        os.unlink(tmp_file_path)
        
        return response.text if response.text else None
    except Exception as e:
        st.error(f"Error transcribing audio: {str(e)}")
        return None

def get_ai_response(messages):
    """Get AI response using Google Gemini"""
    if not get_gemini_client():
        st.error("GOOGLE_API_KEY not found. Please provide it to enable AI chat.")
        return None
    
    try:
        with st.spinner("Thinking..."):
            model = genai.GenerativeModel('gemini-2.0-flash')
            
            # Convert messages format for Gemini
            conversation = []
            for msg in messages:
                if msg["role"] == "user":
                    conversation.append({"role": "user", "parts": [msg["content"]]})
                else:
                    conversation.append({"role": "model", "parts": [msg["content"]]})
            
            response = model.generate_content(
                conversation[-1]["parts"][0] if conversation else "Hello"
            )
        return response.text if response.text else None
    except Exception as e:
        st.error(f"Error getting AI response: {str(e)}")
        return None

def call_murf_tts(text, voice_id="en-US-ken"):
    """Call Murf Falcon TTS API to convert text to speech"""
    api_key = os.getenv("MURF_API_KEY")
    
    if not api_key:
        st.error("MURF_API_KEY not found in environment variables")
        return None
    
    url = "https://api.murf.ai/v1/speech/generate"
    
    headers = {
        "Content-Type": "application/json",
        "api-key": api_key
    }
    
    payload = {
        "voiceId": voice_id,
        "style": "Conversational",
        "text": text,
        "rate": 0,
        "pitch": 0,
        "sampleRate": 48000,
        "format": "MP3",
        "channelType": "STEREO",
        "pronunciationDictionary": {},
        "encodeAsBase64": False,
        "variation": 1,
        "audioDuration": 0,
        "modelVersion": "GEN2"
    }
    
    try:
        with st.spinner("Generating speech..."):
            response = requests.post(url, json=payload, headers=headers, timeout=30)
            
            if response.status_code == 200:
                result = response.json()
                if "audioFile" in result:
                    audio_url = result["audioFile"]
                    audio_response = requests.get(audio_url, timeout=30)
                    if audio_response.status_code == 200:
                        return audio_response.content
                return None
            else:
                st.error(f"API Error: {response.status_code} - {response.text}")
                return None
    except Exception as e:
        st.error(f"Error calling Murf API: {str(e)}")
        return None

def autoplay_audio(audio_bytes):
    """Autoplay audio using HTML5 audio player"""
    if audio_bytes:
        b64 = base64.b64encode(audio_bytes).decode()
        audio_html = f"""
            <audio autoplay>
                <source src="data:audio/mp3;base64,{b64}" type="audio/mp3">
            </audio>
        """
        st.markdown(audio_html, unsafe_allow_html=True)

def plot_waveform(audio_data):
    """Create a waveform visualization from audio data"""
    try:
        # Get audio samples
        samples = np.array(audio_data.get_array_of_samples())
        
        # Create figure with dark theme
        fig, ax = plt.subplots(figsize=(10, 2), facecolor='#0e1117')
        ax.set_facecolor('#1f2937')
        
        # Plot waveform
        time_axis = np.linspace(0, len(samples) / audio_data.frame_rate, len(samples))
        ax.plot(time_axis, samples, color='#3b82f6', linewidth=0.5)
        ax.fill_between(time_axis, samples, alpha=0.3, color='#3b82f6')
        
        # Styling
        ax.set_xlabel('Time (s)', color='#9ca3af')
        ax.set_ylabel('Amplitude', color='#9ca3af')
        ax.tick_params(colors='#9ca3af')
        ax.grid(True, alpha=0.2, color='#374151')
        
        plt.tight_layout()
        return fig
    except Exception as e:
        st.error(f"Error creating waveform: {str(e)}")
        return None

def export_conversation():
    """Export conversation to text file"""
    if not st.session_state.messages:
        return None
    
    export_text = "Voice Chat Conversation\n"
    export_text += "=" * 50 + "\n\n"
    
    for msg in st.session_state.messages:
        role = "You" if msg["role"] == "user" else "Assistant"
        export_text += f"{role}:\n{msg['content']}\n\n"
    
    return export_text

# Available Murf voices
MURF_VOICES = {
    "Ken (US Male)": "en-US-ken",
    "Natalie (US Female)": "en-US-natalie",
    "Clint (US Male)": "en-US-clint",
    "Samantha (US Female)": "en-US-samantha",
    "Terrell (US Male)": "en-US-terrell",
    "Liv (UK Female)": "en-UK-liv",
    "Daniel (UK Male)": "en-UK-daniel",
}

# Initialize session state
if "messages" not in st.session_state:
    st.session_state.messages = []

if "selected_voice" not in st.session_state:
    st.session_state.selected_voice = "en-US-ken"

if "last_audio" not in st.session_state:
    st.session_state.last_audio = None

if "show_waveform" not in st.session_state:
    st.session_state.show_waveform = False

# Header
st.title("🎙️ Voice Chat with Murf AI")

# Sidebar for settings
with st.sidebar:
    st.markdown("### ⚙️ Settings")
    
    selected_voice_name = st.selectbox(
        "Select Voice",
        options=list(MURF_VOICES.keys()),
        index=0
    )
    st.session_state.selected_voice = MURF_VOICES[selected_voice_name]
    
    st.markdown("---")
    st.markdown("### 📊 Status")
    
    gemini_status = "✅ Connected" if os.getenv("GOOGLE_API_KEY") else "❌ Not configured"
    murf_status = "✅ Connected" if os.getenv("MURF_API_KEY") else "❌ Not configured"
    
    st.markdown(f"**Gemini AI:** {gemini_status}")
    st.markdown(f"**Murf API:** {murf_status}")
    
    st.markdown("---")
    
    if st.session_state.messages:
        st.markdown("### 💾 Export")
        export_text = export_conversation()
        if export_text:
            st.download_button(
                label="📥 Download Chat",
                data=export_text,
                file_name="voice_chat_conversation.txt",
                mime="text/plain"
            )

st.markdown("---")

# Main interface
col1, col2 = st.columns([1, 1])

with col1:
    st.markdown("### 🎤 Record Audio")
    audio = audiorecorder("Click to record", "Recording... Click to stop")
    
    if len(audio) > 0:
        st.audio(audio.export().read())
        
        # Display waveform
        waveform_fig = plot_waveform(audio)
        if waveform_fig:
            st.pyplot(waveform_fig)
            plt.close(waveform_fig)
        
        if st.button("🎯 Process Audio", key="process_audio"):
            # Transcribe audio
            transcript = transcribe_audio(audio)
            
            if transcript:
                # Add user message
                st.session_state.messages.append({"role": "user", "content": transcript})
                
                # Get AI response
                ai_messages = [{"role": msg["role"], "content": msg["content"]} 
                              for msg in st.session_state.messages]
                
                response_text = get_ai_response(ai_messages)
                
                if response_text:
                    # Add assistant message
                    st.session_state.messages.append({"role": "assistant", "content": response_text})
                    
                    # Convert to speech and store
                    audio_content = call_murf_tts(response_text, st.session_state.selected_voice)
                    if audio_content:
                        st.session_state.last_audio = audio_content
                        st.session_state.show_waveform = True
                
                st.rerun()

with col2:
    st.markdown("### ✍️ Text Input")
    user_input = st.text_input("Type your message:", key="text_input", label_visibility="collapsed", placeholder="Type your message here...")
    
    if st.button("💬 Send Message", key="send_text"):
        if user_input.strip():
            # Add user message
            st.session_state.messages.append({"role": "user", "content": user_input})
            
            # Get AI response
            ai_messages = [{"role": msg["role"], "content": msg["content"]} 
                          for msg in st.session_state.messages]
            
            response_text = get_ai_response(ai_messages)
            
            if response_text:
                # Add assistant message
                st.session_state.messages.append({"role": "assistant", "content": response_text})
                
                # Convert to speech and store
                audio_content = call_murf_tts(response_text, st.session_state.selected_voice)
                if audio_content:
                    st.session_state.last_audio = audio_content
                    st.session_state.show_waveform = True
            else:
                # If AI response failed, add error message
                st.session_state.messages.append({"role": "assistant", "content": "I apologize, but I encountered an error generating a response. Please try again."})
            
            st.rerun()

st.markdown("---")

# Audio playback section
if st.session_state.last_audio:
    st.markdown("### 🔊 Assistant Response Audio")
    st.audio(st.session_state.last_audio, format="audio/mp3")
    
    # Show waveform for TTS audio if requested
    if st.session_state.show_waveform:
        try:
            # Load MP3 audio using pydub
            from pydub import AudioSegment
            audio_segment = AudioSegment.from_mp3(BytesIO(st.session_state.last_audio))
            
            # Create waveform
            waveform_fig = plot_waveform(audio_segment)
            if waveform_fig:
                st.pyplot(waveform_fig)
                plt.close(waveform_fig)
            
            # Reset flag
            st.session_state.show_waveform = False
        except Exception as e:
            st.warning(f"Could not display waveform: {str(e)}")

st.markdown("---")

# Conversation History
st.markdown("### 💬 Conversation History")

if st.session_state.messages:
    for idx, message in enumerate(st.session_state.messages):
        if message["role"] == "user":
            st.markdown(f"""
                <div class="chat-message user-message">
                    <div class="message-label">You</div>
                    <div class="message-content">{message["content"]}</div>
                </div>
            """, unsafe_allow_html=True)
        else:
            st.markdown(f"""
                <div class="chat-message assistant-message">
                    <div class="message-label">Assistant</div>
                    <div class="message-content">{message["content"]}</div>
                </div>
            """, unsafe_allow_html=True)
    
    if st.button("🗑️ Clear Chat"):
        st.session_state.messages = []
        st.rerun()
else:
    st.info("👋 Welcome! Record audio or type a message to start chatting.")

st.markdown("---")
st.markdown("<p style='text-align: center; color: #6b7280; font-size: 0.875rem;'>Powered by Google Gemini AI & Murf Falcon TTS API</p>", unsafe_allow_html=True)
