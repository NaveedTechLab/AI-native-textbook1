from typing import Dict, Any, Optional
import logging
import os
from openai import OpenAI

logger = logging.getLogger(__name__)

class ContentAdaptationService:
    def __init__(self, gemini_api_key: str = None):
        # Use OpenRouter as OpenAI-compatible API
        self.client = OpenAI(
            api_key=os.getenv("OPENAI_API_KEY"),
            base_url=os.getenv("OPENAI_BASE_URL", "https://openrouter.ai/api/v1")
        )
        self.model_name = "meta-llama/llama-3.1-8b-instruct"  # Fast, efficient model

    def adapt_content(self, content: str, user_background: str, experience_level: str, chapter_id: str) -> str:
        """Adapt content based on user background and experience level"""
        try:
            # Determine adaptation instructions based on user profile
            adaptation_instructions = self._get_adaptation_instructions(user_background, experience_level, chapter_id)

            # Create learning roadmap instead of adapting full content (more practical)
            exp_level_lower = experience_level.lower() if experience_level else 'intermediate'

            # Customize roadmap based on experience level
            if exp_level_lower == 'beginner':
                focus = "Start with fundamentals, use simple analogies, provide detailed step-by-step guidance"
            elif exp_level_lower == 'advanced':
                focus = "Skip basics, focus on advanced topics, optimization, and cutting-edge research"
            else:
                focus = "Balance theory and practice, include real-world applications"

            prompt = f"""You are an educational content adapter for a Physical AI & Humanoid Robotics textbook.

USER PROFILE:
- Background: {user_background}
- Experience Level: **{experience_level.upper()}** ({focus})
- Chapter: {chapter_id}

ADAPTATION INSTRUCTIONS: {adaptation_instructions}

ORIGINAL CONTENT (first 2000 chars):
{content[:2000]}

Create a personalized learning roadmap for this **{experience_level.upper()}** learner with:

1. **Key Focus Areas** (3-5 bullets) - What should they prioritize based on their {experience_level} level?
2. **Learning Path** (numbered steps) - Adjust complexity for {experience_level} level
3. **Practical Exercises** (2-3 exercises) - Match difficulty to {experience_level} background
4. **Level-Specific Tips** - Advice specifically for {experience_level} learners

IMPORTANT: Make clear distinctions based on experience level:
- Beginner: Explain basics, use analogies, step-by-step instructions
- Intermediate: Assume fundamentals known, focus on application
- Advanced: Deep dive into optimization, research, advanced techniques

Format as clear markdown with emoji headers."""

            response = self.client.chat.completions.create(
                model=self.model_name,
                messages=[
                    {"role": "system", "content": "You are an expert educational content adapter specializing in Physical AI and Robotics."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.7,
                max_tokens=800,
            )

            adapted_content = response.choices[0].message.content

            logger.info(f"Adapted content for background: {user_background}, level: {experience_level}")
            return adapted_content

        except Exception as e:
            logger.error(f"Error adapting content: {str(e)}", exc_info=True)
            # Return helpful fallback message
            return f"""### ⚠️ Personalization Temporarily Unavailable

We're working on personalizing this content for your background (**{user_background}**) and experience level (**{experience_level}**).

Meanwhile, the original content below is suitable for all learners. Focus on:
- Understanding core concepts
- Trying code examples
- Building hands-on projects

Error details logged for review."""

    def _get_adaptation_instructions(self, user_background: str, experience_level: str, chapter_id: str) -> str:
        """Generate adaptation instructions based on user profile"""
        instructions = []

        # Add background-specific instructions
        if user_background and 'software' in user_background.lower():
            instructions.append("Include more code examples and programming concepts")
        elif user_background and 'hardware' in user_background.lower():
            instructions.append("Include more hardware specifications and physical implementations")
        else:
            instructions.append("Provide balanced content with both software and hardware aspects")

        # Add experience level-specific instructions (case-insensitive)
        exp_level_lower = experience_level.lower() if experience_level else 'intermediate'

        if exp_level_lower == 'beginner':
            instructions.append("Use simpler explanations, more examples, and step-by-step instructions. Assume no prior knowledge.")
        elif exp_level_lower == 'intermediate':
            instructions.append("Provide moderate complexity with practical applications. Assume basic understanding of concepts.")
        elif exp_level_lower == 'advanced':
            instructions.append("Include complex examples, optimization techniques, and advanced concepts. Assume strong technical background.")
        else:
            instructions.append("Use moderate complexity appropriate for mixed experience levels")

        # Add chapter-specific instructions if needed
        if 'ros2' in chapter_id.lower():
            instructions.append("Focus on ROS 2 concepts like nodes, topics, and URDF")
        elif 'gazebo' in chapter_id.lower() or 'unity' in chapter_id.lower():
            instructions.append("Emphasize simulation concepts, sensors, and environment modeling")
        elif 'nvidia' in chapter_id.lower() or 'isaac' in chapter_id.lower():
            instructions.append("Highlight perception, VSLAM, navigation, and Isaac-specific concepts")
        elif 'vla' in chapter_id.lower():
            instructions.append("Focus on voice, cognitive, and capstone project concepts")

        return "; ".join(instructions)

    def adapt_examples(self, examples: list, user_background: str, experience_level: str) -> list:
        """Adapt code or practical examples based on user profile"""
        try:
            adapted_examples = []
            for example in examples:
                prompt = f"""Adapt this robotics example for a user with {user_background} background and {experience_level} experience level.

Original example:
{example}

Provide the adapted version with relevant comments and explanations."""

                response = self.client.chat.completions.create(
                    model=self.model_name,
                    messages=[
                        {"role": "system", "content": "You are an expert in Physical AI and Robotics education."},
                        {"role": "user", "content": prompt}
                    ],
                    temperature=0.3,
                    max_tokens=1000,
                )

                adapted_examples.append(response.choices[0].message.content)

            logger.info(f"Adapted {len(examples)} examples for background: {user_background}, level: {experience_level}")
            return adapted_examples

        except Exception as e:
            logger.error(f"Error adapting examples: {str(e)}")
            return examples  # Return original examples if adaptation fails