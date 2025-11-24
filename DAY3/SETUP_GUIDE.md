# Health & Wellness Voice Companion - Setup Guide

## Step 1: Add Environment Variables

You need to add these API keys to your Vercel project. You already have two of them, but make sure they're properly configured:

### In your v0 sidebar:
1. Click **"Vars"** on the left sidebar
2. Add/verify these environment variables:

| Variable Name | Value | Status |
|---|---|---|
| `GOOGLE_GENERATIVE_AI_KEY` | Your Google API key | ✅ Already added |
| `MURF_API_KEY` | Your Murf AI key | ✅ Already added |

### Get the API Keys:

**Google Generative AI Key:**
1. Go to https://aistudio.google.com/apikey
2. Click "Create API Key"
3. Copy the key and paste it in the Vars section

**Murf AI Key:**
1. Go to https://murf.ai/account/api
2. Generate or copy your API key
3. Paste it in the Vars section

## Step 2: Using the Voice Wellness Companion

### Text-Based Conversation:
1. Type a message about how you're feeling
2. Examples:
   - "I'm feeling stressed about work today"
   - "I have low energy this morning"
   - "My goal is to exercise for 30 minutes today"

### Voice-Based Conversation (Mic Button):
1. Click the **microphone button** next to the input field
2. Speak your message clearly
3. The app will transcribe your speech
4. The wellness companion will respond via text
5. Click the **speaker button** to hear the response read aloud

## Step 3: Features Explained

### Daily Check-ins:
- The companion asks about your mood and energy
- It references previous conversations
- Provides small, actionable wellness advice

### Data Storage:
- Your check-in history is stored locally in your browser
- This helps the companion provide more personalized responses over time

### Voice Integration:
- **Mic button**: Converts your speech to text using Google's Gemini
- **Speaker button**: Converts the companion's response to speech using Murf AI

## Step 4: Troubleshooting

### "Invalid error response format" or "fetch failed":
- Make sure both API keys are added in the Vars section
- Refresh the page
- Try a simple message like "Hello"

### Mic button not working:
- Check browser permissions (microphone access)
- Try again in a fresh browser tab
- Make sure you're using HTTPS (not HTTP)

### Sound not playing:
- Check your volume is turned up
- Make sure speaker button is visible
- Try a different message

### No response from companion:
- Wait a few seconds - the API might be processing
- Check that GOOGLE_GENERATIVE_AI_KEY is in Vars
- Try a shorter, simpler message

## Step 5: Tips for Best Results

1. **Be specific**: Instead of "I'm fine", say "I'm feeling tired but focused"
2. **Ask for specific advice**: "What can I do to manage my stress?"
3. **Mention context**: "I have a big presentation today and I'm nervous"
4. **Track patterns**: Come back daily to see how the companion learns about you

## API Limits:

- **Google Generative AI**: Generous free tier (check https://aistudio.google.com/pricing)
- **Murf AI**: Free tier includes some speech synthesis credits (check https://murf.ai/pricing)

Enjoy your wellness journey!
