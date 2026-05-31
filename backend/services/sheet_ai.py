"""
Sheet AI Content Generation
Phase 8: Task 8.4 — Extends the existing AI generation service with
6 sheet-specific methods and configurable tones + length presets.
"""

from __future__ import annotations

import logging
from enum import Enum
from typing import Any

logger = logging.getLogger(__name__)


class Tone(str, Enum):
    PROFESSIONAL = "professional"
    ACADEMIC     = "academic"
    CREATIVE     = "creative"
    MARKETING    = "marketing"


class Length(str, Enum):
    SHORT  = "short"   # ~50 words
    MEDIUM = "medium"  # ~150 words
    LONG   = "long"    # ~300 words


# Word-count targets
LENGTH_WORDS = {Length.SHORT: 50, Length.MEDIUM: 150, Length.LONG: 300}

# Tone instruction fragments injected into each prompt
TONE_INSTRUCTIONS = {
    Tone.PROFESSIONAL: "Write in a clear, professional architectural register. Avoid jargon but maintain technical precision.",
    Tone.ACADEMIC:     "Write in a formal academic style suitable for a university design review. Reference theory where appropriate.",
    Tone.CREATIVE:     "Write with creative flair and evocative language that captures spatial quality and atmosphere.",
    Tone.MARKETING:    "Write as a compelling pitch — highlight the project's unique value and impact for a non-specialist audience.",
}


class SheetAIService:
    """AI text generation methods tailored to presentation sheet content."""

    def __init__(self, replicate_service: Any = None) -> None:
        # Accepts an existing ReplicateService / AIService or creates a stub
        self._ai = replicate_service
        logger.info("SheetAIService initialised")

    # ── helpers ──────────────────────────────

    def _call_llm(self, prompt: str, max_words: int) -> str:
        """Call the underlying LLM service; fall back to stub if unavailable."""
        if self._ai is None:
            logger.warning("No AI service attached — returning placeholder text")
            return f"[AI placeholder — {max_words} words about: {prompt[:80]}]"

        try:
            # Reuse existing ai_generation.py generate() interface
            result = self._ai.generate(
                prompt=prompt,
                max_tokens=max_words * 2,
            )
            return result.get("text", "").strip()
        except Exception as exc:
            logger.error("LLM call failed: %s", exc)
            return f"[Generation failed — {exc}]"

    def _build_prompt(
        self,
        task: str,
        context: dict[str, str],
        tone: Tone,
        length: Length,
    ) -> str:
        ctx_lines = "\n".join(f"- {k}: {v}" for k, v in context.items() if v)
        return (
            f"{TONE_INSTRUCTIONS[tone]}\n\n"
            f"Task: {task}\n\n"
            f"Context:\n{ctx_lines}\n\n"
            f"Length: approximately {LENGTH_WORDS[length]} words.\n"
            "Output only the requested text — no preamble, no headings."
        )

    # ── public methods ────────────────────────

    def generate_sheet_title(
        self,
        project_name: str,
        sheet_type:   str,
        tone:  Tone   = Tone.PROFESSIONAL,
    ) -> dict:
        """Short, punchy title line for a presentation sheet."""
        prompt = self._build_prompt(
            task=f"Write a concise presentation sheet title for a '{sheet_type}' sheet.",
            context={"Project": project_name, "Sheet type": sheet_type},
            tone=tone,
            length=Length.SHORT,
        )
        text = self._call_llm(prompt, 15)
        return {"text": text, "type": "sheet_title", "tone": tone, "length": "short"}

    def generate_sheet_description(
        self,
        project_name:  str,
        sheet_type:    str,
        drawing_list:  list[str],
        tone:   Tone   = Tone.ACADEMIC,
        length: Length = Length.MEDIUM,
    ) -> dict:
        """Descriptive paragraph explaining what the sheet shows."""
        drawings_str = ", ".join(drawing_list) if drawing_list else "various drawings"
        prompt = self._build_prompt(
            task=f"Write a sheet description paragraph for a '{sheet_type}' presentation sheet.",
            context={
                "Project":  project_name,
                "Drawings": drawings_str,
            },
            tone=tone,
            length=length,
        )
        text = self._call_llm(prompt, LENGTH_WORDS[length])
        return {"text": text, "type": "sheet_description", "tone": tone,
                "length": length, "word_target": LENGTH_WORDS[length]}

    def generate_design_narrative(
        self,
        project_name:  str,
        design_intent: str,
        key_moves:     list[str],
        tone:   Tone   = Tone.ACADEMIC,
        length: Length = Length.LONG,
    ) -> dict:
        """Full design narrative for design-development or title sheets."""
        moves_str = "; ".join(key_moves) if key_moves else "not specified"
        prompt = self._build_prompt(
            task="Write a design narrative that explains the architectural concept, key design moves, and spatial intentions.",
            context={
                "Project name":   project_name,
                "Design intent":  design_intent,
                "Key moves":      moves_str,
            },
            tone=tone,
            length=length,
        )
        text = self._call_llm(prompt, LENGTH_WORDS[length])
        return {"text": text, "type": "design_narrative", "tone": tone,
                "length": length, "word_target": LENGTH_WORDS[length]}

    def generate_site_analysis_text(
        self,
        site_location:  str,
        site_context:   str,
        analysis_topics: list[str],
        tone:   Tone   = Tone.ACADEMIC,
        length: Length = Length.MEDIUM,
    ) -> dict:
        """Annotation text for site analysis boards."""
        topics_str = ", ".join(analysis_topics) if analysis_topics else "general"
        prompt = self._build_prompt(
            task="Write site analysis annotations covering the key contextual conditions identified.",
            context={
                "Site location": site_location,
                "Context":       site_context,
                "Topics covered": topics_str,
            },
            tone=tone,
            length=length,
        )
        text = self._call_llm(prompt, LENGTH_WORDS[length])
        return {"text": text, "type": "site_analysis", "tone": tone,
                "length": length}

    def generate_material_descriptions(
        self,
        materials: list[dict[str, str]],
        project_context: str,
        tone:   Tone   = Tone.PROFESSIONAL,
        length: Length = Length.SHORT,
    ) -> list[dict]:
        """Generate a short description for each material in a palette."""
        results = []
        for mat in materials:
            mat_name     = mat.get("name", "material")
            mat_finish   = mat.get("finish", "")
            mat_location = mat.get("location", "")
            prompt = self._build_prompt(
                task=f"Write a short description for '{mat_name}' as used in this architectural project.",
                context={
                    "Material":  mat_name,
                    "Finish":    mat_finish,
                    "Location":  mat_location,
                    "Project":   project_context,
                },
                tone=tone,
                length=Length.SHORT,
            )
            text = self._call_llm(prompt, 50)
            results.append({
                "material": mat_name,
                "text":     text,
                "type":     "material_description",
            })
        return results

    def generate_jury_script(
        self,
        project_name:   str,
        design_intent:  str,
        key_drawings:   list[str],
        duration_min:   int,
        tone:   Tone   = Tone.PROFESSIONAL,
    ) -> dict:
        """
        Write a spoken jury / crit presentation script.
        duration_min → approximate word count (130 wpm).
        """
        target_words = duration_min * 130
        drawings_str = ", ".join(key_drawings) if key_drawings else "all drawings"

        prompt = (
            f"{TONE_INSTRUCTIONS[tone]}\n\n"
            "Write a spoken presentation script for an architecture jury / design crit.\n"
            "The speaker should introduce the project, explain the design concept, walk through "
            "the key drawings in sequence, and conclude with the design's broader significance.\n\n"
            f"Project: {project_name}\n"
            f"Design intent: {design_intent}\n"
            f"Drawings to reference: {drawings_str}\n"
            f"Presentation duration: {duration_min} minutes (~{target_words} words).\n\n"
            "Format: flowing prose divided into paragraphs. "
            "Begin each paragraph with the drawing or topic it references in brackets, e.g. [Site Plan]."
        )
        text = self._call_llm(prompt, target_words)
        return {
            "text":          text,
            "type":          "jury_script",
            "duration_min":  duration_min,
            "target_words":  target_words,
            "tone":          tone,
        }

    def rewrite(
        self,
        existing_text: str,
        instruction:   str,
        tone:   Tone   = Tone.PROFESSIONAL,
        length: Length = Length.MEDIUM,
    ) -> dict:
        """Rewrite existing text with a specific instruction."""
        prompt = (
            f"{TONE_INSTRUCTIONS[tone]}\n\n"
            f"Rewrite the following text. Instruction: {instruction}\n\n"
            f"Original:\n{existing_text}\n\n"
            f"Target length: ~{LENGTH_WORDS[length]} words.\n"
            "Output only the rewritten text."
        )
        text = self._call_llm(prompt, LENGTH_WORDS[length])
        return {"text": text, "type": "rewrite", "tone": tone, "length": length}


# ─────────────────────────────────────────────
# SINGLETON
# ─────────────────────────────────────────────

_sheet_ai: SheetAIService | None = None


def get_sheet_ai_service(replicate_service: Any = None) -> SheetAIService:
    global _sheet_ai
    if _sheet_ai is None:
        _sheet_ai = SheetAIService(replicate_service)
    return _sheet_ai
