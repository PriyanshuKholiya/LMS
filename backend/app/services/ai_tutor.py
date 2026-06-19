import io
import json
import logging
from typing import List, Dict, Any, Optional
from openai import OpenAI
from pypdf import PdfReader
from app.core.config import settings

logger = logging.getLogger(__name__)

# Initialize OpenAI client if key is provided
client = None
if settings.OPENAI_API_KEY and settings.OPENAI_API_KEY.strip() not in ("", "mock-key-for-development"):
    try:
        client = OpenAI(api_key=settings.OPENAI_API_KEY)
    except Exception as e:
        logger.error(f"Failed to initialize OpenAI client: {e}")


class AITutorService:
    @staticmethod
    def generate_chat_response(chat_history: List[Dict[str, str]], user_message: str) -> str:
        """
        Generates a standard conversation reply from the AI Tutor.
        """
        if not client:
            return (
                f"Hello! I am currently running in mock developer mode because no `OPENAI_API_KEY` was found in the environment. "
                f"You asked: '{user_message}'. Please configure your OpenAI API Key in the backend `.env` file to enable real chatbot replies."
            )

        try:
            # Build messages array starting with tutor instructions
            messages = [
                {
                    "role": "system",
                    "content": "You are a helpful, extremely knowledgeable AI Tutor inside a University Learning Management System (LMS). "
                               "Your goal is to guide students, explain concepts clearly, provide helpful examples, and format responses "
                               "using clean Markdown. Keep answers pedagogical and concise."
                }
            ]
            
            # Append history (limited to last 10 messages for token efficiency)
            for msg in chat_history[-10:]:
                messages.append({
                    "role": msg["role"],
                    "content": msg["content"]
                })
                
            # Append new user message
            messages.append({"role": "user", "content": user_message})

            response = client.chat.completions.create(
                model="gpt-4o-mini",
                messages=messages,
                temperature=0.7,
                max_tokens=800
            )
            return response.choices[0].message.content or ""
        except Exception as e:
            logger.error(f"OpenAI chat completion error: {e}")
            return f"Error communicating with AI Tutor: {e}"

    @staticmethod
    def explain_concept(concept_name: str, course_title: str) -> str:
        """
        Explain a concept in detail with visual markdown formatting.
        """
        if not client:
            return (
                f"# Concept Explanation: {concept_name} (Mock Mode)\n\n"
                f"Here is an explanation of **{concept_name}** in the context of the course *{course_title}*.\n\n"
                f"### Core Concept\n"
                f"1. **Definition**: This is a mock response because `OPENAI_API_KEY` is not set.\n"
                f"2. **Application**: Once you supply a real OpenAI key, the tutor will write high-fidelity breakdowns here.\n\n"
                f"### Quick Example\n"
                f"```python\n"
                f"# Demonstration\n"
                f"print('Understanding {concept_name}!')\n"
                f"```"
            )

        try:
            prompt = (
                f"You are a computer science professor. Explain the concept of '{concept_name}' "
                f"in the context of the class '{course_title}'. "
                f"Break it down into simple terms, explain why it matters, and provide a clear "
                f"code snippet or mathematical example. Format with clean Markdown."
            )

            response = client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[
                    {"role": "system", "content": "You are an expert academic educator."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.6,
                max_tokens=1000
            )
            return response.choices[0].message.content or ""
        except Exception as e:
            logger.error(f"OpenAI concept explanation error: {e}")
            return f"Error generating concept explanation: {e}"

    @staticmethod
    def generate_mcqs(topic: str, num_questions: int = 3) -> List[Dict[str, Any]]:
        """
        Generate multiple choice questions in a JSON structured format.
        """
        if not client:
            # Return high-quality mock MCQs
            return [
                {
                    "question_text": f"Which of the following describes the key mechanism of {topic}?",
                    "choices": [
                        "It optimizes weight layers sequentially.",
                        "It ignores gradient descent vectors entirely.",
                        "It acts as a static compiler rule.",
                        "None of the above."
                    ],
                    "correct_index": 0
                },
                {
                    "question_text": f"What is a primary bottleneck when implementing {topic}?",
                    "choices": [
                        "Hardware constraints & compute bandwidth.",
                        "Variable scopes in mock environments.",
                        "Inefficient garbage collection in local storage.",
                        "Excessive metadata configurations."
                    ],
                    "correct_index": 0
                }
            ][:num_questions]

        try:
            prompt = (
                f"Generate exactly {num_questions} Multiple Choice Questions (MCQs) on the topic of '{topic}'. "
                f"For each question, provide a question text, exactly 4 choices, and specify the 0-indexed correct answer. "
                f"You MUST return the output as a valid JSON list matching this schema, without any markdown formatting or code blocks:\n"
                f"[\n"
                f"  {{\n"
                f"    \"question_text\": \"Question string...\",\n"
                f"    \"choices\": [\"Option 0\", \"Option 1\", \"Option 2\", \"Option 3\"],\n"
                f"    \"correct_index\": 0\n"
                f"  }}\n"
                f"]"
            )

            response = client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[
                    {"role": "system", "content": "You are an exam generator. You only output raw, valid JSON lists matching requested schemas. Do not write text outside the JSON."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.5,
                max_tokens=1200
            )
            
            raw_content = response.choices[0].message.content or ""
            # Strip markdown fences if OpenAI returned them despite instruction
            if raw_content.startswith("```"):
                lines = raw_content.splitlines()
                if lines[0].startswith("```"):
                    lines = lines[1:]
                if lines[-1].startswith("```"):
                    lines = lines[:-1]
                raw_content = "\n".join(lines)
                
            return json.loads(raw_content.strip())
        except Exception as e:
            logger.error(f"OpenAI MCQ generator error: {e}")
            # Fallback MCQ on parsing error
            return [
                {
                    "question_text": f"Practice question on {topic} (Error loading dynamic AI questions)",
                    "choices": ["Retry connection", "Provide API keys", "Check internet access", "All of the above"],
                    "correct_index": 3
                }
            ]

    @staticmethod
    def summarize_pdf(pdf_file_bytes: bytes) -> str:
        """
        Parses PDF file contents and uses LLM to generate summaries.
        """
        # 1. Parse text from PDF bytes
        text_extract = ""
        try:
            pdf_file = io.BytesIO(pdf_file_bytes)
            reader = PdfReader(pdf_file)
            
            # Read first 10 pages maximum to prevent exceeding context window limits
            pages_to_read = min(len(reader.pages), 10)
            for i in range(pages_to_read):
                page = reader.pages[i]
                text_extract += page.extract_text() or ""
                
            text_extract = text_extract[:8000] # Cap text character length
        except Exception as e:
            logger.error(f"PDF extraction failed: {e}")
            return f"Failed to parse PDF document: {e}"

        if not text_extract.strip():
            return "The PDF file appears to be empty or does not contain extractable text."

        if not client:
            return (
                f"# Summary of Uploaded Document (Mock Mode)\n\n"
                f"We extracted **{len(text_extract)}** characters of text from the PDF file. "
                f"Below is a mock summary because `OPENAI_API_KEY` is not set in `.env`.\n\n"
                f"- **Key Point 1**: The document starts with: *\"{text_extract[:100]}...\"*\n"
                f"- **Key Point 2**: Set up your OpenAI API Key to get a comprehensive semantic summary of the contents."
            )

        try:
            prompt = (
                f"You are an academic researcher. Summarize the following course material extract. "
                f"Extract the main concepts, key definitions, and organize them into clear bullet points "
                f"with a final summary paragraph. Context:\n\n{text_extract}"
            )

            response = client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[
                    {"role": "system", "content": "You are a professional document summarizing assistant."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.5,
                max_tokens=1000
            )
            return response.choices[0].message.content or ""
        except Exception as e:
            logger.error(f"OpenAI PDF summarization error: {e}")
            return f"Error generating PDF summary: {e}"

    @staticmethod
    def generate_study_plan(topic: str, duration_weeks: int = 4) -> str:
        """
        Generate a structured week-by-week study plan.
        """
        if not client:
            return (
                f"# Weekly Study Plan: {topic} ({duration_weeks} Weeks - Mock)\n\n"
                f"Roadmap to master **{topic}** over the next {duration_weeks} weeks.\n\n"
                f"## Week 1: Foundations\n"
                f"- **Focus**: Setup, basic syntax, and terminology.\n"
                f"- **Task**: Complete exercises on basic concepts.\n\n"
                f"## Week 2: Intermediate Core\n"
                f"- **Focus**: Understanding data flows and structures.\n"
                f"- **Task**: Write a small prototype.\n\n"
                f"## Week 3: Complex Applications\n"
                f"- **Focus**: Performance optimizations and integrations.\n"
                f"- **Task**: Review error traces and refactor.\n\n"
                f"## Week 4: Capstone Review\n"
                f"- **Focus**: Final testing, projects, and self-assessment.\n"
                f"- **Task**: Complete MCQ practice sets."
            )

        try:
            prompt = (
                f"Construct a structured, week-by-week study plan for mastering '{topic}' "
                f"over a duration of {duration_weeks} weeks. For each week, specify the core focus area, "
                f"suggested readings or modules, and a hands-on practice milestone task. "
                f"Format output as a clean Markdown syllabus document."
            )

            response = client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[
                    {"role": "system", "content": "You are a guidance counselor and study planner."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.6,
                max_tokens=1000
            )
            return response.choices[0].message.content or ""
        except Exception as e:
            logger.error(f"OpenAI study planner error: {e}")
            return f"Error creating study plan: {e}"
