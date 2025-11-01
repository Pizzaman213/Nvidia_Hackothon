"""
LLM Prompt Templates
"""


def get_system_prompt(child_age: int, child_gender: str | None = None) -> str:
    """
    Generate age-appropriate system prompt for the AI babysitter
    """
    # Determine pronoun usage
    pronoun_info = ""
    if child_gender:
        if child_gender.lower() in ['male', 'm', 'boy']:
            pronoun_info = " (use he/him pronouns when referring to the child)"
        elif child_gender.lower() in ['female', 'f', 'girl']:
            pronoun_info = " (use she/her pronouns when referring to the child)"
        elif child_gender.lower() in ['non-binary', 'nb', 'they']:
            pronoun_info = " (use they/them pronouns when referring to the child)"

    base_prompt = f"""You are a helpful, friendly AI babysitter assistant for a {child_age}-year-old child{pronoun_info}. You help children with:
- Engaging in safe, age-appropriate conversations
- Telling stories and playing educational games
- Helping with homework (explain concepts, guide thinking, but don't give direct answers)
- Recognizing when to alert parents about safety concerns

Safety rules you MUST follow:
- Never suggest the child do anything dangerous or risky
- If the child mentions injury, illness, pain, or distress, immediately express concern
- Keep all content age-appropriate for a {child_age}-year-old
- Refuse to discuss topics unsuitable for children (violence, adult content, etc.)
- If uncertain about safety, err on the side of caution
- Never instruct child to leave home alone or interact with strangers
- If child seems upset, scared, or hurt, stay calm and supportive

Interaction style:
- Use simple, clear language appropriate for age {child_age}
- Be warm, encouraging, and patient
- Ask open-ended questions to engage thinking
- Celebrate effort and learning, not just correct answers
- Keep responses concise and engaging
"""

    # Age-specific adjustments
    if child_age <= 5:
        base_prompt += """
For this young child:
- Use very simple words and short sentences
- Incorporate playful sounds and repetition
- Focus on basic concepts and imagination
- Make learning feel like play
"""
    elif child_age <= 8:
        base_prompt += """
For this elementary-age child:
- Use clear explanations with examples
- Encourage curiosity and questions
- Help with basic reading, math, and science
- Support creative play and storytelling
"""
    elif child_age <= 12:
        base_prompt += """
For this pre-teen:
- Provide more detailed explanations
- Support critical thinking
- Help with more complex homework
- Discuss age-appropriate social topics
"""
    else:
        base_prompt += """
For this teenager:
- Engage in more mature discussions (while maintaining appropriateness)
- Support complex problem-solving
- Encourage independent thinking
- Be a positive mentor figure
"""

    return base_prompt


def get_safety_analysis_prompt(message: str, child_age: int, conversation_context: str = "") -> str:
    """
    Generate prompt for safety analysis
    """
    prompt = f"""Analyze this message from a {child_age}-year-old child for safety concerns:

Child's message: "{message}"
"""

    if conversation_context:
        prompt += f"""
Previous conversation context:
{conversation_context}
"""

    prompt += """
Flag as a concern if the message mentions or implies:
- Injury, pain, or physical discomfort
- Illness or not feeling well
- Fear, sadness, or emotional distress
- Being alone or unsupervised
- Strangers or unusual situations
- Unsafe activities or dangerous behavior
- Requests to do something potentially harmful
- Anything that suggests the child needs immediate help

Return your analysis in JSON format:
{
    "is_safe": true/false,
    "concern_level": "none/low/medium/high/critical",
    "reason": "brief explanation of any concerns",
    "parent_alert": true/false,
    "recommended_response": "how to respond to the child"
}

Be cautious but not overly alarmed. Children often use dramatic language. Focus on genuine safety issues.
"""
    return prompt


def get_homework_help_prompt(problem_description: str, child_age: int, image_context: str | None = None) -> str:
    """
    Generate prompt for homework assistance
    """
    prompt = f"""Help this {child_age}-year-old child with their homework.

Problem: {problem_description}
"""

    if image_context:
        prompt += f"\nImage analysis: {image_context}\n"

    prompt += """
Guidelines:
- Explain the concept, don't give the answer directly
- Break down the problem into steps
- Ask guiding questions to help them think
- Encourage them to try solving it themselves
- Celebrate their thinking process
- Use age-appropriate language and examples
- Do NOT show your reasoning or thinking process to the child
- Only provide the child-friendly guidance

Provide your response as a helpful explanation that guides their learning.
"""
    return prompt


def get_story_prompt(theme: str, child_age: int, length: str = "medium") -> str:
    """
    Generate prompt for story creation
    """
    length_guidance = {
        "short": "2-3 paragraphs",
        "medium": "4-6 paragraphs",
        "long": "7-10 paragraphs"
    }

    # Age-specific story guidance
    age_guidance = ""
    if child_age <= 5:
        age_guidance = """
Age-specific guidance for very young children (ages 3-5):
- Use simple, repetitive language with rhythm
- Focus on basic emotions and everyday experiences
- Include familiar objects and animals
- Use sound effects and playful words (whoosh, splash, etc.)
- Keep plot very simple with clear cause and effect
- Emphasize colors, shapes, and counting when appropriate
- Make it short and sweet with lots of action
"""
    elif child_age <= 8:
        age_guidance = """
Age-specific guidance for early elementary (ages 6-8):
- Use clear, descriptive language
- Include basic problem-solving by characters
- Feature friendships and teamwork
- Add gentle humor and fun surprises
- Include simple moral lessons about kindness, sharing, bravery
- Create relatable situations (school, family, friends)
- Balance imagination with recognizable reality
"""
    elif child_age <= 12:
        age_guidance = """
Age-specific guidance for pre-teens (ages 9-12):
- Use more sophisticated vocabulary and complex sentences
- Include meaningful challenges that require clever solutions
- Develop characters with distinct personalities and growth
- Add subtle plot twists and mysteries
- Explore themes of courage, determination, and self-discovery
- Include diverse perspectives and situations
- Balance fantasy elements with realistic emotions
"""
    elif child_age <= 14:
        age_guidance = """
Age-specific guidance for early teens (ages 13-14):
- Use mature, engaging narrative voice
- Include complex character development and internal conflicts
- Explore deeper themes (identity, belonging, choices and consequences)
- Add layered plots with subtext
- Feature realistic dialogue and relationships
- Include moral ambiguity where appropriate
- Balance entertainment with thought-provoking content
"""
    else:
        age_guidance = """
Age-specific guidance for older teens (ages 15+):
- Use sophisticated literary techniques and rich vocabulary
- Develop complex, multi-dimensional characters
- Explore mature themes thoughtfully (still age-appropriate)
- Include philosophical questions or moral dilemmas
- Feature realistic conflicts and nuanced resolutions
- Use symbolism and metaphor
- Write with depth that respects their intelligence and maturity
"""

    return f"""Create an engaging, age-appropriate story for a {child_age}-year-old.

Theme: {theme}
Length: {length_guidance.get(length, "4-6 paragraphs")}

Story guidelines:
- Make it fun, imaginative, and positive
- Include a clear beginning, middle, and end
- Feature characters the reader can relate to or admire
- Include a meaningful message or lesson (subtle, not preachy)
- Use vivid descriptions and exciting moments
- Keep it completely appropriate for age {child_age}
- No scary, violent, or inappropriate content
- End on a satisfying note

{age_guidance}

Write the story in an engaging, storyteller voice that captivates this age group!
"""


def get_image_analysis_prompt(context: str, child_age: int) -> str:
    """
    Generate prompt for image analysis based on context
    """
    prompts = {
        "homework": f"""Analyze this homework image for a {child_age}-year-old child.

Identify:
- Subject (math, reading, science, etc.)
- Specific problem or question visible
- Key information needed to help
- Any work the child has already done

Provide a clear description that can be used to help the child understand and solve the problem.
""",

        "game": """Analyze this image for an "I Spy" game.

Identify all visible objects that a child could find, focusing on:
- Common, recognizable items (toys, furniture, everyday objects)
- Colors and shapes
- Interesting details
- Things a child would notice and be able to point to

Provide your response in this exact format:
Objects I can see:
- [object 1]
- [object 2]
- [object 3]
(continue listing all visible objects)

Be specific with object names (e.g., "red ball" instead of just "ball", "teddy bear" instead of "stuffed animal").
List at least 8-15 objects if possible to make the game fun!
""",

        "safety_check": """Analyze this image for any safety concerns.

Look for:
- Potential hazards or dangers
- Signs of injury or distress
- Inappropriate content
- Concerning situations

If the image is safe and appropriate, say so clearly. If there are concerns, describe them specifically.
""",

        "show_tell": f"""Analyze this image a {child_age}-year-old child wants to show you.

Describe:
- What the main item/subject is
- Interesting details about it
- Why it might be special or cool
- Questions you could ask to engage the child

Respond with enthusiasm and curiosity appropriate for their age.
"""
    }

    return prompts.get(context, "Describe what you see in this image in a way appropriate for children.")


def get_emotion_detection_prompt(message: str) -> str:
    """
    Generate prompt for emotion detection
    """
    return f"""Analyze the emotional tone of this child's message:

"{message}"

Identify the primary emotion expressed. Choose ONE:
- happy
- sad
- angry
- scared
- frustrated
- excited
- neutral
- concerned

Respond with only the emotion word, nothing else.
"""
