# Voice Chat with Murf AI

A modern voice chat application built with Python and Streamlit that integrates OpenAI GPT-5 for conversational AI and Murf Falcon TTS API for realistic text-to-speech.

## Overview

This application provides a complete voice chat experience with:
- **Speech-to-Text**: Uses OpenAI Whisper to transcribe voice recordings
- **Conversational AI**: Powered by OpenAI GPT-5 for intelligent, context-aware responses
- **Text-to-Speech**: Murf Falcon TTS API for high-quality voice synthesis
- **Modern UI**: Clean, dark-themed interface with visual feedback
- **Audio Visualization**: Waveform displays for both input and output audio

## Features

### Core Functionality
1. **Microphone Input**: Record audio messages with a simple click-to-record interface
2. **Text Input**: Alternative text-based input for accessibility
3. **AI Responses**: Intelligent conversational responses using GPT-5
4. **Voice Synthesis**: High-quality TTS with multiple voice options
5. **Audio Playback**: Automatic playback of AI responses with waveform visualization

### Voice Options
- Ken (US Male)
- Natalie (US Female)
- Clint (US Male)
- Samantha (US Female)
- Terrell (US Male)
- Liv (UK Female)
- Daniel (UK Male)

### Additional Features
- **Conversation History**: View entire chat history with user/assistant distinction
- **Waveform Visualization**: Real-time audio waveforms for recordings and TTS output
- **Export Conversations**: Download chat history as text file
- **API Status Indicators**: Visual indicators for API connection status
- **Clear Chat**: Reset conversation at any time

## Architecture

### Technology Stack
- **Framework**: Streamlit
- **AI Model**: OpenAI GPT-5 (released August 7, 2025)
- **Speech-to-Text**: OpenAI Whisper-1
- **Text-to-Speech**: Murf Falcon TTS API (GEN2 model)
- **Audio Processing**: pydub, numpy
- **Visualization**: matplotlib

### Data Flow
1. User records audio OR types text
2. Audio → Whisper transcription → text
3. Text → GPT-5 → AI response
4. AI response → Murf TTS → audio
5. Audio displayed with waveform visualization
6. Conversation stored in session state

### Session State Management
- `messages`: List of conversation messages (role + content)
- `selected_voice`: Current Murf voice ID
- `last_audio`: Latest TTS audio bytes for playback
- `show_waveform`: Flag to display waveform on next render

## API Configuration

### Required API Keys
1. **OPENAI_API_KEY**: For GPT-5 chat completions and Whisper transcription
   - Add to Replit Secrets
   - Ensure account has sufficient quota/credits
   
2. **MURF_API_KEY**: For text-to-speech synthesis
   - Add to Replit Secrets
   - Get from https://murf.ai/api

### API Endpoints Used
- OpenAI Chat Completions: `gpt-5` model
- OpenAI Whisper: `whisper-1` model
- Murf TTS: `https://api.murf.ai/v1/speech/generate`

## Development

### Running the App
```bash
streamlit run app.py --server.port 5000
```

The workflow is configured to run automatically on port 5000.

### File Structure
- `app.py`: Main application file
- `.streamlit/config.toml`: Streamlit server configuration
- `pyproject.toml`: Python dependencies
- `replit.md`: This documentation file

### Key Dependencies
- streamlit>=1.51.0
- openai (latest)
- requests
- streamlit-audiorecorder
- pydub
- numpy
- matplotlib

### System Dependencies
- ffmpeg-full: Required for audio processing
- portaudio: Required for audio recording

## Usage

1. **Text Chat**:
   - Type message in text input
   - Click "💬 Send Message"
   - Wait for AI response and audio playback

2. **Voice Chat**:
   - Click "Click to record" button
   - Speak your message
   - Click again to stop recording
   - View waveform of your recording
   - Click "🎯 Process Audio"
   - Wait for transcription, AI response, and audio playback

3. **Customize Voice**:
   - Use sidebar dropdown to select preferred voice
   - Choice persists for all subsequent responses

4. **Export Conversation**:
   - Sidebar "📥 Download Chat" button appears when messages exist
   - Downloads conversation as plain text file

## Troubleshooting

### "OpenAI API: ❌ Not configured"
- Add OPENAI_API_KEY to Replit Secrets
- Restart the workflow

### "Murf API: ❌ Not configured"
- Add MURF_API_KEY to Replit Secrets
- Restart the workflow

### OpenAI API Quota Exceeded
- Error: "insufficient_quota"
- Solution: Add credits to OpenAI account or use different API key

### Audio Not Playing
- Check browser permissions for audio playback
- Ensure Murf API key is valid
- Check browser console for errors

### Waveform Not Displaying
- Requires matplotlib and numpy
- Check that audio data is valid
- Review console for visualization errors

## Recent Changes

### 2025-11-22: Initial Implementation
- Created complete voice chat application
- Integrated OpenAI GPT-5 and Whisper
- Integrated Murf Falcon TTS API
- Added 7 voice options
- Implemented waveform visualization
- Added conversation export
- Created modern dark-themed UI
- Added error handling for API failures

## Known Limitations

1. **Browser Audio Permissions**: User must enable audio permissions in browser
2. **API Rate Limits**: Both OpenAI and Murf have rate limits
3. **Audio Format**: TTS output is MP3, recording uses WAV
4. **Session Persistence**: Conversations reset on page refresh
5. **Single User**: No multi-user support or authentication

## Future Enhancements

Potential improvements for future development:
- Multi-language support
- Conversation persistence (database)
- User authentication
- Custom voice training
- Real-time streaming TTS
- Background noise reduction
- Conversation search/filtering
- Analytics and usage tracking
