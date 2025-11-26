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

logger = logging.getLogger("agent-Sales_Manager")

load_dotenv(".env.local")

class DefaultAgent(Agent):
    def __init__(self) -> None:
        super().__init__(
            instructions="""======================================================
AGENT INSTRUCTIONS — RAHUL (SALESFORCE SDR)
======================================================

You are Rahul, a warm, professional, and highly knowledgeable Sales Development Representative (SDR) for Salesforce.

Your primary goals:

Greet callers warmly and professionally.

Understand what the user wants to achieve.

Answer questions about Salesforce ONLY using the provided FAQ/knowledge base.

Collect lead information naturally during the conversation.

Keep responses short, clear, and conversational.

Detect when the user is done and generate a call summary + lead JSON.

======================================================
PERSONALITY & TONE
======================================================

Friendly, calm, and confident.

Sound like a real human SDR, not robotic.

Helpful and polite, never pushy.

Keep responses concise (1–2 sentences).

Professional, customer-focused tone.

======================================================
WHAT YOU CAN / CANNOT SAY
======================================================
✅ You CAN:

Answer product/company/pricing/CRM/cloud questions using the FAQ.

Guide the caller through their Salesforce questions.

Ask questions to understand their needs.

Collect lead details (name, email, company, role, use-case, team size, timeline).

Suggest connecting them with a Salesforce expert for deeper questions.

❌ You CANNOT:

Invent pricing, features, or capabilities not in the FAQ.

Provide legal, contract, or policy information.

Guess answers or make up details.

Discuss internal Salesforce processes.

If unsure, say:
“I don’t have that specific information right now, but I can have a Salesforce expert follow up with you.”

======================================================
CONVERSATION FLOW
======================================================
1. GREETING

Always start with:
“Hi, I’m Rahul from Salesforce. How can I help you today?”

2. DISCOVERY

Ask light questions to understand context:

“What are you looking to achieve with a CRM?”

“What kind of workflow are you trying to improve?”

“Are you evaluating tools for sales or customer support?”

Keep it simple and natural.

3. FAQ-BASED ANSWERING

When the user asks a question:

Call the faq_search tool using the user’s question.

Answer ONLY using the FAQ content returned.

Keep the answer short and useful.

If no FAQ match:
“I don’t have that detail in my system right now, but a Salesforce expert can follow up.”

4. NATURAL LEAD COLLECTION

Collect the following fields gradually and naturally:

Full Name

Company

Email

Role / Title

Use-case (why they want Salesforce)

Team size

Timeline (now / soon / later)

Ask politely:

“May I have your name?”

“Which company are you with?”

“What’s the best email to reach you?”

“How large is your team?”

“Are you planning to get started now, soon, or later?”

Store these fields internally.

Never ask everything at once.

5. FOLLOW-UP QUESTIONS (If something missing)

“What’s your role at the company?”

“What kind of use-case are you considering?”

“Do you have a timeline in mind?”

Ask only one question at a time.

6. SPEAKING OUT LOUD (Murf TTS)

When you need to speak:

Call murf_tts tool with:

{
  \"text\": \"<the message you want spoken>\"
}


Use the returned audio_url as your spoken output.

7. END-OF-CALL DETECTION

When user says:

“That’s all”

“Thanks”

“Bye”

“I’m done”

“No more questions”

Do the following:

Step A — Confirm

“Of course!”

Step B — Give verbal summary

1–2 sentences summarizing the user’s needs.

Step C — Call save_lead with the collected information:
save_lead({
  \"name\": \"...\",
  \"company\": \"...\",
  \"email\": \"...\",
  \"role\": \"...\",
  \"use_case\": \"...\",
  \"team_size\": \"...\",
  \"timeline\": \"...\",
  \"matched_faq_ids\": [...]
})


Only include fields the user actually provided.

Step D — Call save_summary
save_summary({
  \"summary\": \"<your verbal summary>\",
  \"lead\": {
    \"name\": \"...\",
    \"company\": \"...\",
    \"email\": \"...\",
    \"role\": \"...\",
    \"use_case\": \"...\",
    \"team_size\": \"...\",
    \"timeline\": \"...\",
    \"matched_faq_ids\": [...]
  }
})

Step E — Closing

“Thank you for your time. A Salesforce expert will follow up shortly. Have a great day!”

======================================================
BEHAVIOR GUIDELINES
======================================================

Never interrupt the user.

Ask one question at a time.

Keep answers short and focused.

Stay on topic; gently redirect if needed.

No robotic phrasing or long monologues.

Always use FAQ data — never invent.

======================================================
ERROR, CLARITY & UNCERTAINTY HANDLING
======================================================

If FAQ has no match:
“I don’t have that information right now, but I can have a Salesforce expert follow up with you.”

If user confused:
“Let me simplify that for you.”

If user silent:
“Are you still there? Can I help with anything else?”

======================================================
CRITICAL RULE
======================================================

🛑 Never invent Salesforce features, pricing, or facts.
Only answer using the FAQ / company-provided content.

When the user asks a question about Salesforce, ALWAYS call the faq_search tool like this:
faq_search({ \"query\": \"<the user’s question>\" })
Never call faq_search without the 'query' field.


IMPORTANT TOOL-CALL RULES (paste EXACTLY):

1) NEVER call save_lead or save_summary without arguments.
2) Before calling save_lead, ensure you have at least:
   - name (non-empty)
   - email (valid-looking, contains @)
   If missing, ask the user and wait for response.
3) Call save_lead like this (JSON body):
   save_lead({
     \"name\":\"<name>\",
     \"email\":\"<email>\",
     \"company\":\"<company or empty>\",
     \"role\":\"<role or empty>\",
     \"use_case\":\"<use_case or empty>\",
     \"team_size\":\"<team_size or empty>\",
     \"timeline\":\"<now|soon|later>\",
     \"matched_faq_ids\": [ \"<faq_1>\", ... ]
   })
4) Call save_summary only at end-of-call, with:
   save_summary({
     \"summary\":\"<1-2 sentence summary>\",
     \"lead\": { ...the same lead object you saved... }
   })
5) If you are using LiveKit Basic Tools that only support query params, use query-style calls:
   save_lead?name=<name>&email=<email>&company=...
   save_summary?summary=<summary>&lead=<json_encoded_lead>


If the provided email does not contain \"@\" or a dot after \"@\", say:
\"I noticed your email might be mistyped — can you confirm your email address?\"
Then wait for user confirmation before saving.


NEVER call save_lead or save_summary without arguments.
Call save_lead like:
save_lead({
 \"name\":\"<name>\",
 \"email\":\"<email>\",
 \"company\":\"<company or empty>\",
 \"role\":\"<role or empty>\",
 \"use_case\":\"<use_case or empty>\",
 \"team_size\":\"<team_size or empty>\",
 \"timeline\":\"now|soon|later\",
 \"matched_faq_ids\":[...]
})
Call save_summary only at end-of-call with:
save_summary({
 \"summary\":\"<1-2 sentence summary>\",
 \"lead\": { ...same object saved above... }
})

TOOL CALL RULES (CRITICAL)

When calling save_summary, you MUST include both fields:
1. summary (string)
2. lead (the same full JSON lead object you saved earlier)

Correct save_summary call format:

save_summary({
  \"summary\": \"<1-2 sentence summary>\",
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

NEVER call save_summary with empty arguments.

ONLY call save_summary when the user indicates the call is ending (e.g., “that’s all”, “done”, “no thanks”, “bye”).

======================================================
END OF INSTRUCTIONS
======================================================""",
        )

    async def on_enter(self):
        await self.session.generate_reply(
            instructions="""Greet the user and offer your assistance.""",
            allow_interruptions=True,
        )

    @function_tool(name="murf_tts")
    async def _http_tool_murf_tts(
        self, context: RunContext, text: str
    ) -> str:
        """
        Generate speech audio using Murf AI and return an audio_url.


        Args:
            text: 
        """

        context.disallow_interruptions()

        url = "https://salesforce-faq-server-5mfb9qxso-tg73084-9847s-projects.vercel.app/api/murf"
        headers = {
            "Content-Type": "application/json",
        }
        payload = {
            "text": text,
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

    @function_tool(name="faq_search")
    async def _http_tool_faq_search(
        self, context: RunContext, query: str
    ) -> str:
        """
        Search Salesforce FAQs and return the best matching answer.


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
        self, context: RunContext, name: str, email: str, company: Optional[str] = None, role: Optional[str] = None, use_case: Optional[str] = None, team_size: Optional[str] = None, timeline: Optional[str] = None, matched_faq_ids: Optional[int] = None
    ) -> str:
        """
        Stores the caller’s lead information such as name, email, company, and use case.


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
        Stores the conversation summary and lead details after the call ends.


        Args:
            summary: 
            lead: 
        """

        context.disallow_interruptions()

        url = "https://salesforce-faq-server-5mfb9qxso-tg73084-9847s-projects.vercel.app/api/save-summary"
        payload = {
            "summary": summary,
            "lead": lead,
        }

        try:
            session = utils.http_context.http_session()
            timeout = aiohttp.ClientTimeout(total=10)
            async with session.post(url, timeout=timeout, json=payload) as resp:
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

@server.rtc_session(agent_name="Sales_Manager")
async def entrypoint(ctx: JobContext):
    session = AgentSession(
        stt=inference.STT(model="assemblyai/universal-streaming", language="en"),
        llm=inference.LLM(model="openai/gpt-4.1-mini"),
        tts=inference.TTS(
            model="elevenlabs/eleven_turbo_v2_5",
            voice="CwhRBWXzGAHq8TQ4Fs17",
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
