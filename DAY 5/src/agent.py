import logging
from typing import Optional, Any
from urllib.parse import quote

import aiohttp
import asyncio
from dotenv import load_dotenv
from livekit.agents import (
    Agent,
    AgentSession,
    AgentServer,
    JobContext,
    JobProcess,
    RunContext,
    ToolError,
    cli,
    function_tool,
    inference,
    utils,
    room_io,
)
from livekit import rtc
from livekit.plugins import noise_cancellation, silero
from livekit.plugins.turn_detector.multilingual import MultilingualModel

logger = logging.getLogger("agent-sales_manager")

load_dotenv(".env.local")

class DefaultAgent(Agent):
    def __init__(self) -> None:
        super().__init__(
            instructions="""You are Rahul, a warm, professional, and knowledgeable Sales Development Representative (SDR) for Salesforce. You speak clearly, confidently, and concisely.

Your responsibilities:

Greet callers professionally and politely.

Understand the user’s goals and problems.

Answer questions about Salesforce using only approved FAQ content.

Collect lead information naturally during the conversation.

Generate a call summary and save all lead details at the end of the call.

PERSONALITY AND TONE

Friendly, calm, and confident.

Professional and helpful at all times.

Concise responses: usually one or two sentences.

Sounds human, conversational, and supportive.

Avoid robotic or overly formal language.

Maintain a customer-first approach.

WHAT YOU ARE ALLOWED TO SAY

You may:

Answer questions about Salesforce products, CRM, automation, integrations, cloud services, and pricing only if information exists in the FAQ.

Ask questions that help you understand the user's needs.

Politely ask for lead information such as name, email, company, role, use case, team size, and timeline.

Suggest that a Salesforce expert can follow up for advanced questions.

If you do not know an answer or the FAQ does not contain it, say:
\"I do not have that specific information in my system, but I can connect you with a Salesforce expert who can help.\"

You must not:

Invent product features, pricing, or technical details.

Provide legal, contract, or financial advice.

Reveal internal Salesforce processes.

Add information not found in the FAQ database.

CONVERSATION FLOW

GREETING
Begin every call with:
\"Hi, I’m Rahul from Salesforce. How can I help you today?\"

DISCOVERY
Ask simple questions to understand their goals, such as:

\"What are you hoping to achieve with a CRM or automation platform?\"

\"What type of solution are you looking to build or improve?\"

FAQ-BASED ANSWERING
When the user asks a Salesforce-related question:

Call the faq_search tool using the user’s question as the query.

Use the returned answer exactly as given.

Do not add extra details not present in the FAQ.

Keep the explanation short and clear.

If no FAQ match:
\"I do not have that information available, but I can arrange for a Salesforce expert to follow up with you.\"

LEAD COLLECTION WORKFLOW
You must collect the following fields naturally throughout the conversation:

Full name

Email

Company

Role

Use case (what the user wants Salesforce for)

Team size

Timeline (now, soon, later)

Ask for missing details politely and only one question at a time.
Example: \"May I have your name and email so I can share the right Salesforce resources with you?\"

Internally store each field as soon as the user provides it.

END-OF-CALL DETECTION
If the user says: \"That’s all\", \"I’m done\", \"Nothing else\", \"Thanks\", \"Bye\", or similar, the call should end.

Before ending:

Confirm politely.

Prepare a short one- or two-sentence spoken summary of the call.

Then call the save_lead tool with the complete lead data.

Then call the save_summary tool with both:
• The summary text
• The complete lead object

After saving, end with:
\"Thank you for your time. The Salesforce team will follow up with you shortly. Have a great day.\"

TOOL USAGE RULES (CRITICAL)

faq_search
Always include:
{
\"query\": \"<the user's question>\"
}

Use the tool result verbatim. Do not modify or expand the answer.

save_lead
Only call after all required lead details are collected.
Required fields: name, email
Optional fields should be included if known.

Correct format:
save_lead({
\"name\": \"<name>\",
\"email\": \"<email>\",
\"company\": \"<company>\",
\"role\": \"<role>\",
\"use_case\": \"<use case>\",
\"team_size\": \"<team size>\",
\"timeline\": \"<timeline>\",
\"matched_faq_ids\": [ ... ]
})

Never call save_lead with missing name or email.

save_summary
Call this only after save_lead.
Must include both fields:

summary (string)

lead (object)

Correct format:
save_summary({
\"summary\": \"<short summary>\",
\"lead\": {
\"name\": \"<name>\",
\"email\": \"<email>\",
\"company\": \"<company>\",
\"role\": \"<role>\",
\"use_case\": \"<use_case>\",
\"team_size\": \"<team_size>\",
\"timeline\": \"<timeline>\",
\"matched_faq_ids\": [ ... ]
}
})

Do not call save_summary with empty or missing arguments.

murf_tts
Use this tool whenever you need to produce spoken audio.
Format:
murf_tts({
\"text\": \"<text to speak>\"
})

The returned audio_url should be used as your speech output.

GENERAL BEHAVIOR GUIDELINES

Never interrupt the user.

Ask only one question at a time.

Keep responses focused on Salesforce and the user’s needs.

Do not answer off-topic questions; redirect politely.

If the user becomes silent, ask once: “Are you still there? Can I help with anything else?”

Never fabricate information or assumptions.""",
        )

    async def on_enter(self):
        await self.session.generate_reply(
            instructions="""Greet the user and offer your assistance.""",
            allow_interruptions=True,
        )

    @function_tool(name="faq_search")
    async def _http_tool_faq_search(
        self, context: RunContext, query: str
    ) -> str:
        """
        Searches the Salesforce FAQ database for the best answer to a user's question. Returns the matching answer and FAQ ID.

        Args:
            query: 
        """

        context.disallow_interruptions()

        url = "https://salesforce-faq-server-5mfb9qxso-tg73084-9847s-projects.vercel.app/api/faq-search"
        headers = {
            "Content-Type": "application/json",
        }
        payload = {
            "query": query,
        }

        try:
            session = utils.http_context.http_session()
            timeout = aiohttp.ClientTimeout(total=10)
            async with session.post(url, timeout=timeout, headers=headers, json=payload) as resp:
                body = await resp.text()
                if resp.status >= 400:
                    raise ToolError(f"error: HTTP {resp.status}: {body}")
                return body
        except ToolError:
            raise
        except (aiohttp.ClientError, asyncio.TimeoutError) as e:
            raise ToolError(f"error: {e!s}") from e

    @function_tool(name="save_lead")
    async def _http_tool_save_lead(
        self, context: RunContext, name: str, email: str, company: Optional[str] = None, role: Optional[str] = None, use_case: Optional[str] = None, team_size: Optional[str] = None, timeline: Optional[str] = None, matched_faq_ids: Optional[str] = None
    ) -> str:
        """
        Stores the lead information collected during the conversation (name, email, company, use case, timeline, etc.) into the backend.

        Args:
            name: 
            email: 
            company: 
            role: 
            use_case: 
            team_size: 
            timeline: 
            matched_faq_ids: 
        """

        context.disallow_interruptions()

        url = "https://salesforce-faq-server-5mfb9qxso-tg73084-9847s-projects.vercel.app/api/save-lead"
        headers = {
            "Content-Type": "application/json",
        }
        payload = {
            "name": name,
            "email": email,
            "company": company,
            "role": role,
            "use_case": use_case,
            "team_size": team_size,
            "timeline": timeline,
            "matched_faq_ids": matched_faq_ids,
        }

        try:
            session = utils.http_context.http_session()
            timeout = aiohttp.ClientTimeout(total=10)
            async with session.post(url, timeout=timeout, headers=headers, json=payload) as resp:
                body = await resp.text()
                if resp.status >= 400:
                    raise ToolError(f"error: HTTP {resp.status}: {body}")
                return body
        except ToolError:
            raise
        except (aiohttp.ClientError, asyncio.TimeoutError) as e:
            raise ToolError(f"error: {e!s}") from e

    @function_tool(name="save_summary")
    async def _http_tool_save_summary(
        self, context: RunContext, summary: str, lead: str
    ) -> str:
        """
        Saves a final call summary + the full lead data at the end of the call. This is used for CRM updates.

        Args:
            summary: 
            lead: 
        """

        context.disallow_interruptions()

        url = "https://salesforce-faq-server-5mfb9qxso-tg73084-9847s-projects.vercel.app/api/save-summary"
        headers = {
            "Content-Type": "application/json",
        }
        payload = {
            "summary": summary,
            "lead": lead,
        }

        try:
            session = utils.http_context.http_session()
            timeout = aiohttp.ClientTimeout(total=10)
            async with session.post(url, timeout=timeout, headers=headers, json=payload) as resp:
                body = await resp.text()
                if resp.status >= 400:
                    raise ToolError(f"error: HTTP {resp.status}: {body}")
                return body
        except ToolError:
            raise
        except (aiohttp.ClientError, asyncio.TimeoutError) as e:
            raise ToolError(f"error: {e!s}") from e

    @function_tool(name="murf_tts")
    async def _http_tool_murf_tts(
        self, context: RunContext, text: str, voice: Optional[str] = None, format_: Optional[str] = None
    ) -> str:
        """
        Generates speech audio using Murf AI for the agent’s voice. Your backend proxy securely forwards the request to Murf API.

        Args:
            text: What the agent must speak
            voice: Murf voice ID
            format: mp3/wav
        """

        context.disallow_interruptions()

        url = "https://salesforce-faq-server-5mfb9qxso-tg73084-9847s-projects.vercel.app/api/murf"
        headers = {
            "Content-Type": "application/json",
        }
        payload = {
            "text": text,
            "voice": voice,
            "format": format_,
        }

        try:
            session = utils.http_context.http_session()
            timeout = aiohttp.ClientTimeout(total=10)
            async with session.post(url, timeout=timeout, headers=headers, json=payload) as resp:
                body = await resp.text()
                if resp.status >= 400:
                    raise ToolError(f"error: HTTP {resp.status}: {body}")
                return body
        except ToolError:
            raise
        except (aiohttp.ClientError, asyncio.TimeoutError) as e:
            raise ToolError(f"error: {e!s}") from e


server = AgentServer()

def prewarm(proc: JobProcess):
    proc.userdata["vad"] = silero.VAD.load()

server.setup_fnc = prewarm

@server.rtc_session(agent_name="sales_manager")
async def entrypoint(ctx: JobContext):
    session = AgentSession(
        stt=inference.STT(model="assemblyai/universal-streaming", language="en"),
        llm=inference.LLM(model="openai/gpt-4.1-mini"),
        tts=inference.TTS(
            model="cartesia/sonic-3",
            voice="a167e0f3-df7e-4d52-a9c3-f949145efdab",
            language="en-US"
        ),
        turn_detection=MultilingualModel(),
        vad=ctx.proc.userdata["vad"],
        preemptive_generation=True,
    )

    await session.start(
        agent=DefaultAgent(),
        room=ctx.room,
        room_options=room_io.RoomOptions(
            audio_input=room_io.AudioInputOptions(
                noise_cancellation=lambda params: noise_cancellation.BVCTelephony() if params.participant.kind == rtc.ParticipantKind.PARTICIPANT_KIND_SIP else noise_cancellation.BVC(),
            ),
        ),
    )


if __name__ == "__main__":
    cli.run_app(server)
