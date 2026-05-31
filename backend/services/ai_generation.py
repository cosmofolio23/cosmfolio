"""
AI generation service with Replicate LLM integration
Phase 4: Task 4.2 - Free LLM integration with Replicate API
Supports Llama 2, Mistral, and other open-source models
"""

import logging
import os
import asyncio
import time
from typing import Optional, Dict, Any, List
from enum import Enum
import replicate

logger = logging.getLogger(__name__)

# Rate limiting for free tier
REPLICATE_FREE_TIER_DELAY = 1.0  # seconds between API calls
REPLICATE_MAX_RETRIES = 3
REPLICATE_RETRY_DELAY = 2.0  # seconds

# ==================== AI CONFIGURATION ====================

class AiTone(str, Enum):
    """Available tone options for AI generation"""
    academic = "academic"
    professional = "professional"
    creative = "creative"
    technical = "technical"
    marketing = "marketing"


class AiGenerationService:
    """AI-powered content generation service with Replicate integration"""

    def __init__(self):
        """Initialize AI service with Replicate client"""
        self.api_token = os.getenv("REPLICATE_API_TOKEN")
        if not self.api_token:
            logger.warning("REPLICATE_API_TOKEN not set. Using mock mode.")
            self.use_replicate = False
        else:
            self.use_replicate = True
            logger.info("Replicate API token configured")

        self.tone_descriptions = {
            AiTone.academic.value: "Formal, scholarly, well-researched tone for academic presentation",
            AiTone.professional.value: "Professional, business-focused, corporate tone",
            AiTone.creative.value: "Creative, engaging, storytelling-focused tone",
            AiTone.technical.value: "Technical, detailed, specification-focused tone",
            AiTone.marketing.value: "Marketing, persuasive, conversion-focused tone",
        }

        # Model configuration - using free tier compatible models
        self.models = {
            "llama2": "replicate/llama-2-70b-chat:2796214f78e5eec3d865db034e748e11018e16966319624e650e7ee309b68423",
            "mistral": "mistralai/mistral-7b-instruct-v0.2:39e3d495476446348f432fa00cab2a274c4c36b57a4ae865a42b9e16fb2e4e6b",
            "neural-chat": "replicate/neural-chat-7b-v3-1:6a98652fc7a126ce519eaa2147d2c3ebc4ae059c4d17150715c4652f28b19consider",
        }
        self.default_model = "llama2"
        self.last_call_time = 0

    # ==================== PROJECT TEXT GENERATION ====================

    async def generate_project_description(
        self,
        project_type: str,
        location: Optional[str],
        project_title: str,
        tone: str = "professional"
    ) -> Dict[str, str]:
        """
        Generate project description using AI

        Returns: {description, brief, strategy}
        """
        try:
            prompt = self._build_project_prompt(
                project_type, location, project_title, tone
            )

            # Call actual LLM (or mock if unavailable)
            full_response = await self._call_llm(
                prompt,
                temperature=0.7,
                max_tokens=800
            )

            # Parse response - assume it has 3 sections
            lines = [line.strip() for line in full_response.split('\n') if line.strip()]

            # Try to extract three parts, fallback to truncating if needed
            if len(lines) >= 3:
                description = '\n'.join(lines[:5])  # First ~5 lines = description
                brief = '\n'.join(lines[5:8])  # Next ~3 lines = brief
                strategy = '\n'.join(lines[8:12]) if len(lines) > 8 else '\n'.join(lines[5:])
            else:
                description = full_response
                brief = full_response[:200]
                strategy = full_response[200:]

            logger.info(f"Generated project description for {project_title}")

            return {
                "description": description,
                "brief": brief,
                "strategy": strategy,
                "tone": tone,
            }

        except Exception as e:
            logger.error(f"Error generating project description: {str(e)}")
            raise

    async def generate_concept_statement(
        self,
        project_type: str,
        title: str,
        description: Optional[str],
        tone: str = "creative"
    ) -> str:
        """Generate concept statement for project"""
        try:
            prompt = f"""Generate a compelling concept statement for an architecture project:
Title: {title}
Type: {project_type}
Description: {description or 'Not provided'}
Tone: {self.tone_descriptions.get(tone, tone)}

Create a 2-3 sentence concept statement that captures the essence and vision of the project.
Respond with only the concept statement, no additional text."""

            statement = await self._call_llm(
                prompt,
                temperature=0.8,
                max_tokens=200
            )

            logger.info(f"Generated concept statement for {title}")
            return statement.strip()

        except Exception as e:
            logger.error(f"Error generating concept statement: {str(e)}")
            raise

    # ==================== IMAGE CAPTION GENERATION ====================

    async def generate_image_caption(
        self,
        image_context: str,
        asset_type: str,
        tone: str = "professional"
    ) -> str:
        """
        Generate caption for image

        Args:
            image_context: Description of what's in the image
            asset_type: Type of asset (render, plan, section, etc.)
            tone: Tone for caption
        """
        try:
            prompt = f"""Generate a concise, compelling caption for an architecture image:
Asset Type: {asset_type}
Context: {image_context}
Tone: {self.tone_descriptions.get(tone, tone)}

Create a 1-2 sentence caption that describes the image effectively.
Respond with only the caption, no additional text."""

            caption = await self._call_llm(
                prompt,
                temperature=0.6,
                max_tokens=150
            )

            logger.info(f"Generated caption for {asset_type}")
            return caption.strip()

        except Exception as e:
            logger.error(f"Error generating caption: {str(e)}")
            raise

    # ==================== PORTFOLIO TEXT GENERATION ====================

    async def generate_portfolio_bio(
        self,
        architect_name: str,
        specialties: List[str],
        experience_years: Optional[int],
        tone: str = "professional"
    ) -> str:
        """Generate architect biography"""
        try:
            prompt = f"""Generate a professional biography for an architect:
Name: {architect_name}
Specialties: {', '.join(specialties)}
Years of Experience: {experience_years or 'Not specified'}
Tone: {self.tone_descriptions.get(tone, tone)}

Create a 3-4 sentence biography that establishes credibility and expertise.
Respond with only the biography, no additional text."""

            bio = await self._call_llm(
                prompt,
                temperature=0.7,
                max_tokens=300
            )

            logger.info(f"Generated biography for {architect_name}")
            return bio.strip()

        except Exception as e:
            logger.error(f"Error generating biography: {str(e)}")
            raise

    # ==================== TITLE & TAGLINE GENERATION ====================

    async def suggest_project_titles(
        self,
        project_type: str,
        description: Optional[str],
        count: int = 5
    ) -> List[str]:
        """
        Suggest creative project titles

        Returns: List of suggested titles
        """
        try:
            prompt = f"""Suggest {count} creative and professional titles for an architecture project:
Type: {project_type}
Description: {description or 'Not provided'}

Generate exactly {count} unique project titles that are memorable and descriptive.
Format: Return as a numbered list, one title per line.
Example:
1. Title One
2. Title Two
etc."""

            response = await self._call_llm(
                prompt,
                temperature=0.8,
                max_tokens=300
            )

            # Parse titles from response
            titles = []
            for line in response.split('\n'):
                line = line.strip()
                if line:
                    # Remove numbering if present
                    if line[0].isdigit():
                        line = line.split('.', 1)[1].strip() if '.' in line else line[1:].strip()
                    if line:
                        titles.append(line)

            # Ensure we have the requested count
            titles = titles[:count] if len(titles) >= count else titles + [
                self._generate_mock_text(f"Title {i}", length="short")
                for i in range(count - len(titles))
            ]

            logger.info(f"Generated {len(titles)} project title suggestions")
            return titles[:count]

        except Exception as e:
            logger.error(f"Error generating titles: {str(e)}")
            raise

    async def generate_portfolio_tagline(
        self,
        firm_name: str,
        specialties: List[str],
        tone: str = "creative"
    ) -> List[str]:
        """
        Generate portfolio taglines

        Returns: List of tagline options
        """
        try:
            prompt = f"""Generate 5 catchy portfolio taglines for an architecture firm:
Firm: {firm_name}
Specialties: {', '.join(specialties)}
Tone: {self.tone_descriptions.get(tone, tone)}

Create 5 unique taglines (5-10 words each) that capture the firm's essence and appeal.
Format: Return as a numbered list, one tagline per line.
Example:
1. Tagline One
2. Tagline Two
etc."""

            response = await self._call_llm(
                prompt,
                temperature=0.8,
                max_tokens=300
            )

            # Parse taglines from response
            taglines = []
            for line in response.split('\n'):
                line = line.strip()
                if line:
                    # Remove numbering if present
                    if line[0].isdigit():
                        line = line.split('.', 1)[1].strip() if '.' in line else line[1:].strip()
                    if line:
                        taglines.append(line)

            # Ensure we have 5 taglines
            taglines = taglines[:5] if len(taglines) >= 5 else taglines + [
                self._generate_mock_text(f"Tagline {i}", length="short")
                for i in range(5 - len(taglines))
            ]

            logger.info(f"Generated {len(taglines)} portfolio taglines for {firm_name}")
            return taglines[:5]

        except Exception as e:
            logger.error(f"Error generating taglines: {str(e)}")
            raise

    # ==================== REPLICATE API HELPER ====================

    async def _call_llm(
        self,
        prompt: str,
        model: str = None,
        max_tokens: int = 500,
        temperature: float = 0.7
    ) -> str:
        """
        Call Replicate LLM with rate limiting and retry logic

        Args:
            prompt: The prompt to send to the model
            model: Which model to use (default: llama2)
            max_tokens: Maximum tokens in response
            temperature: Creativity level (0.0-1.0)

        Returns:
            Generated text from LLM
        """
        if not self.use_replicate:
            return self._generate_mock_text(prompt.split('\n')[0], length="medium")

        model = model or self.default_model
        model_url = self.models.get(model, self.models[self.default_model])

        # Rate limiting for free tier
        time_since_last = time.time() - self.last_call_time
        if time_since_last < REPLICATE_FREE_TIER_DELAY:
            await asyncio.sleep(REPLICATE_FREE_TIER_DELAY - time_since_last)

        for attempt in range(REPLICATE_MAX_RETRIES):
            try:
                logger.info(f"Calling {model} API (attempt {attempt + 1}/{REPLICATE_MAX_RETRIES})")

                # Call Replicate API synchronously in async context
                # The replicate library handles the async operations internally
                output = await asyncio.to_thread(
                    replicate.run,
                    model_url,
                    input={
                        "prompt": prompt,
                        "max_tokens": max_tokens,
                        "temperature": temperature,
                    }
                )

                self.last_call_time = time.time()

                # Combine output (might be list of strings)
                if isinstance(output, list):
                    result = "".join(output)
                else:
                    result = str(output)

                logger.info(f"Generated {len(result)} characters")
                return result.strip()

            except Exception as e:
                logger.warning(f"Attempt {attempt + 1} failed: {str(e)}")
                if attempt < REPLICATE_MAX_RETRIES - 1:
                    await asyncio.sleep(REPLICATE_RETRY_DELAY)
                else:
                    logger.error(f"Failed to generate content after {REPLICATE_MAX_RETRIES} attempts")
                    # Fallback to mock
                    return self._generate_mock_text(prompt.split('\n')[0], length="medium")

    # ==================== HELPER METHODS ====================

    def _build_project_prompt(
        self,
        project_type: str,
        location: Optional[str],
        title: str,
        tone: str
    ) -> str:
        """Build prompt for project generation"""
        return f"""Generate comprehensive text content for an architecture project:
Title: {title}
Type: {project_type}
Location: {location or 'Not specified'}
Tone: {self.tone_descriptions.get(tone, tone)}

Provide:
1. Detailed project description (150-200 words)
2. Project brief (50-75 words)
3. Design strategy (100-150 words)

Generate only the content, no labels or explanations."""

    def _generate_mock_text(
        self,
        topic: str,
        length: str = "medium"
    ) -> str:
        """
        Generate mock text (fallback when API unavailable)

        In production, falls back when Replicate API fails or is unavailable.
        """
        text_map = {
            "short": f"{topic}. A carefully crafted element of the design.",
            "medium": f"{topic}. This represents a key aspect of the architectural vision, demonstrating thoughtful design and careful consideration of the space and its users.",
            "long": f"{topic}. The project showcases a comprehensive approach to modern architecture, integrating innovative design principles with practical functionality. Every element has been carefully considered to create a harmonious and inspiring environment.",
        }
        return text_map.get(length, text_map["medium"])

    # ==================== TONE CONFIGURATION ====================

    def get_available_tones(self) -> Dict[str, str]:
        """Get all available tones and descriptions"""
        return self.tone_descriptions

    def validate_tone(self, tone: str) -> bool:
        """Check if tone is valid"""
        return tone in self.tone_descriptions

    # ==================== CONTENT ANALYSIS ====================

    async def analyze_content_quality(
        self,
        text: str
    ) -> Dict[str, Any]:
        """
        Analyze quality of provided content

        Returns: {readability_score, word_count, suggestions}
        """
        words = len(text.split())
        sentences = len(text.split('.'))
        avg_words_per_sentence = words / sentences if sentences > 0 else 0

        # Mock scoring
        readability_score = min(100, 60 + (300 - avg_words_per_sentence) // 5)

        suggestions = []
        if words < 50:
            suggestions.append("Content is too brief. Consider adding more detail.")
        elif words > 500:
            suggestions.append("Content is lengthy. Consider condensing for readability.")

        if avg_words_per_sentence > 20:
            suggestions.append("Sentences are long. Break into shorter, clearer sentences.")

        return {
            "word_count": words,
            "sentence_count": sentences,
            "avg_words_per_sentence": round(avg_words_per_sentence, 2),
            "readability_score": readability_score,
            "suggestions": suggestions,
        }

    # ==================== CONTENT IMPROVEMENT ====================

    async def improve_text(
        self,
        text: str,
        aspect: str = "clarity"
    ) -> str:
        """
        Improve existing text

        Args:
            text: Text to improve
            aspect: What to improve - clarity, brevity, engagement, tone
        """
        try:
            aspect_guidance = {
                "clarity": "Make it clear and easy to understand. Use simple language and remove jargon.",
                "brevity": "Make it concise and concise. Remove redundancy and unnecessary words.",
                "engagement": "Make it engaging and interesting. Add compelling language and variety.",
                "tone": "Improve the tone. Make it professional and appropriate for an architecture portfolio.",
            }
            guidance = aspect_guidance.get(aspect, f"Improve {aspect}")

            prompt = f"""Improve the following architectural text for {aspect}:

Original text:
{text}

Instructions: {guidance}

Provide the improved version. Respond with only the improved text, no explanation."""

            improved = await self._call_llm(
                prompt,
                temperature=0.6,
                max_tokens=500
            )

            logger.info(f"Improved text for {aspect}")
            return improved.strip()

        except Exception as e:
            logger.error(f"Error improving text: {str(e)}")
            raise


# ==================== SINGLETON INSTANCE ====================

_ai_generation_service = None

def get_ai_generation_service() -> AiGenerationService:
    """Get or create AI generation service singleton"""
    global _ai_generation_service
    if _ai_generation_service is None:
        _ai_generation_service = AiGenerationService()
    return _ai_generation_service
