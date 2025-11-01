"""
Knowledge Base Ingestion Script
Populates the RAG vector database with public domain content from CDC, CPSC, NIH
"""
import asyncio
from typing import List, Dict, Any
from pathlib import Path
import json

from app.services.rag_service import rag_service, KNOWLEDGE_SOURCES
from app.utils.logger import setup_logger

logger = setup_logger(__name__)


# Sample CDC content (public domain - no copyright)
CDC_CHILD_CARE_CONTENT = [
    {
        "text": """Basic Safety Rules for Children:
1. Never leave young children unattended, especially near water, in cars, or around potential hazards.
2. Keep small objects, medications, and cleaning products out of reach.
3. Use safety gates at stairs and secure furniture to walls to prevent tip-overs.
4. Always use appropriate car seats and seat belts for the child's age and size.
5. Teach children basic safety rules like looking both ways before crossing streets.""",
        "metadata": {
            **KNOWLEDGE_SOURCES["cdc_safety"],
            "topic": "basic_safety",
            "age_range": "all",
            "section": "Safety Fundamentals"
        }
    },
    {
        "text": """Injury Prevention for Young Children:
Falls are a leading cause of injury for young children. To prevent falls:
- Install window guards and safety gates
- Keep floors clear of toys and clutter
- Use non-slip mats in bathtubs
- Never leave a baby unattended on changing tables or beds
- Secure heavy furniture and TVs to walls with safety straps""",
        "metadata": {
            **KNOWLEDGE_SOURCES["cdc_safety"],
            "topic": "injury_prevention",
            "age_range": "0-5",
            "section": "Fall Prevention"
        }
    },
    {
        "text": """Poisoning Prevention:
Keep all medications, vitamins, and supplements in original containers with child-resistant caps.
Store household chemicals and cleaners in locked cabinets.
Never refer to medicine as candy.
Keep the Poison Control number (1-800-222-1222) readily available.
Install carbon monoxide detectors in your home.""",
        "metadata": {
            **KNOWLEDGE_SOURCES["cdc_safety"],
            "topic": "poisoning_prevention",
            "age_range": "all",
            "section": "Chemical Safety"
        }
    },
    {
        "text": """Choking Prevention:
Children under 4 are at highest risk for choking. Avoid foods like:
- Whole grapes, cherry tomatoes (cut into quarters)
- Hot dogs (cut lengthwise and into small pieces)
- Hard candies, popcorn, nuts
- Large chunks of meat or cheese
Always supervise meals and teach children to chew food thoroughly and sit while eating.""",
        "metadata": {
            **KNOWLEDGE_SOURCES["cdc_safety"],
            "topic": "choking_prevention",
            "age_range": "0-4",
            "section": "Food Safety"
        }
    },
    {
        "text": """Water Safety:
Drowning is a leading cause of death for young children. Safety measures include:
- Never leave children unattended near water, even for a moment
- Empty buckets, wading pools, and bathtubs immediately after use
- Install four-sided fencing around pools with self-closing, self-latching gates
- Learn CPR and keep rescue equipment poolside
- Ensure children wear properly fitted life jackets on boats""",
        "metadata": {
            **KNOWLEDGE_SOURCES["cdc_safety"],
            "topic": "water_safety",
            "age_range": "all",
            "section": "Drowning Prevention"
        }
    },
    {
        "text": """Fire Safety:
Install smoke alarms on every level of your home and test them monthly.
Keep matches and lighters out of children's reach.
Teach children to stop, drop, and roll if clothes catch fire.
Create and practice a fire escape plan with two exits from every room.
Keep space heaters at least 3 feet away from anything that can burn.""",
        "metadata": {
            **KNOWLEDGE_SOURCES["cdc_safety"],
            "topic": "fire_safety",
            "age_range": "all",
            "section": "Fire Prevention"
        }
    },
    {
        "text": """Car Seat Safety:
Use the right car seat for your child's age and size:
- Rear-facing car seat: Birth to at least age 2
- Forward-facing car seat: After outgrowing rear-facing, typically 2-4 years
- Booster seat: After outgrowing forward-facing, typically 4-8 years
- Seat belt: When they're big enough for proper fit, typically 8-12 years
Always follow manufacturer instructions and have installation checked by a certified technician.""",
        "metadata": {
            **KNOWLEDGE_SOURCES["cdc_safety"],
            "topic": "car_safety",
            "age_range": "0-12",
            "section": "Vehicle Safety"
        }
    },
    {
        "text": """Nutrition Guidelines for Children:
Encourage a balanced diet with:
- Fruits and vegetables: 5 or more servings daily
- Whole grains: At least half of grain intake
- Lean proteins: Fish, poultry, beans, and nuts
- Dairy: Low-fat milk, yogurt, and cheese
- Water: Primary beverage, limit sugary drinks
Involve children in meal planning and preparation to encourage healthy eating habits.""",
        "metadata": {
            **KNOWLEDGE_SOURCES["cdc_child_care"],
            "topic": "nutrition",
            "age_range": "2-12",
            "section": "Healthy Eating"
        }
    },
    {
        "text": """Sleep Recommendations:
Adequate sleep is crucial for children's development:
- Infants (4-12 months): 12-16 hours per 24 hours (including naps)
- Toddlers (1-2 years): 11-14 hours per 24 hours (including naps)
- Preschool (3-5 years): 10-13 hours per 24 hours (including naps)
- School age (6-12 years): 9-12 hours per 24 hours
Maintain consistent bedtime routines and limit screen time before bed.""",
        "metadata": {
            **KNOWLEDGE_SOURCES["cdc_child_care"],
            "topic": "sleep",
            "age_range": "all",
            "section": "Sleep Health"
        }
    },
    {
        "text": """Physical Activity Guidelines:
Children and adolescents should have 60 minutes or more of physical activity daily:
- Aerobic activity: Most of the 60 minutes should be moderate-to-vigorous intensity
- Muscle strengthening: At least 3 days per week
- Bone strengthening: At least 3 days per week
Encourage active play and limit screen time to no more than 2 hours daily.""",
        "metadata": {
            **KNOWLEDGE_SOURCES["cdc_child_care"],
            "topic": "physical_activity",
            "age_range": "6-17",
            "section": "Exercise and Fitness"
        }
    },
    {
        "text": """First Aid Basics for Parents:
Keep a well-stocked first aid kit and know how to treat common injuries:
- Cuts and scrapes: Clean with soap and water, apply antibiotic ointment, cover with bandage
- Burns: Cool with running water for 10 minutes, don't use ice, cover with clean cloth
- Bumps and bruises: Apply ice pack wrapped in cloth for 15-20 minutes
- Nosebleeds: Lean forward, pinch soft part of nose for 10 minutes
Always seek medical attention for serious injuries or if unsure.""",
        "metadata": {
            **KNOWLEDGE_SOURCES["cdc_safety"],
            "topic": "first_aid",
            "age_range": "all",
            "section": "Emergency Care"
        }
    },
    {
        "text": """Emotional Development Support:
Help children develop emotional intelligence:
- Validate their feelings and help them name emotions
- Teach coping strategies like deep breathing or counting to ten
- Model healthy emotional expression
- Provide consistent routines and clear expectations
- Encourage problem-solving and decision-making
- Praise effort and persistence, not just achievement""",
        "metadata": {
            **KNOWLEDGE_SOURCES["cdc_child_care"],
            "topic": "emotional_development",
            "age_range": "all",
            "section": "Mental Health"
        }
    },
    {
        "text": """Internet Safety for Kids:
Protect children online:
- Keep computers in common areas
- Use parental controls and child-safe search engines
- Teach children never to share personal information online
- Monitor social media use and friend lists
- Discuss cyberbullying and how to report it
- Establish family rules about screen time and appropriate content""",
        "metadata": {
            **KNOWLEDGE_SOURCES["cdc_safety"],
            "topic": "internet_safety",
            "age_range": "6-17",
            "section": "Digital Safety"
        }
    },
    {
        "text": """Stranger Danger Education:
Teach children safety awareness without creating fear:
- Identify trusted adults they can turn to for help
- Practice saying 'no' to uncomfortable situations
- Use the buddy system when out
- Know their address and parent phone numbers
- Understand the difference between surprises and secrets
- Never accept rides or gifts from strangers""",
        "metadata": {
            **KNOWLEDGE_SOURCES["cdc_safety"],
            "topic": "personal_safety",
            "age_range": "4-12",
            "section": "Child Safety Education"
        }
    },
    {
        "text": """Homework Help Best Practices:
Support children's learning without doing the work for them:
- Create a quiet, well-lit homework space
- Establish a consistent homework routine
- Break large assignments into smaller tasks
- Ask guiding questions rather than providing answers
- Encourage effort and persistence
- Communicate with teachers about challenges
- Celebrate progress and completed work""",
        "metadata": {
            **KNOWLEDGE_SOURCES["cdc_child_care"],
            "topic": "education_support",
            "age_range": "6-17",
            "section": "Academic Development"
        }
    }
]


# CPSC Product Safety Content (public domain)
CPSC_SAFETY_CONTENT = [
    {
        "text": """Toy Safety Guidelines:
Choose age-appropriate toys and check for:
- Small parts that could cause choking (for children under 3)
- Sharp edges or points
- Loud noises that could damage hearing
- Toxic materials or lead paint
- Strong magnets (can be dangerous if swallened)
Regularly inspect toys for damage and repair or discard broken toys.""",
        "metadata": {
            **KNOWLEDGE_SOURCES["cpsc_safety"],
            "topic": "toy_safety",
            "age_range": "all",
            "section": "Product Safety"
        }
    },
    {
        "text": """Crib and Sleep Safety:
Follow safe sleep practices:
- Use a firm, flat mattress with fitted sheet
- No pillows, blankets, bumpers, or stuffed animals in crib
- Place baby on back to sleep
- Room temperature should be comfortable (not too hot)
- Slats should be no more than 2 3/8 inches apart
- Mattress should fit snugly with no gaps""",
        "metadata": {
            **KNOWLEDGE_SOURCES["cpsc_safety"],
            "topic": "crib_safety",
            "age_range": "0-2",
            "section": "Safe Sleep"
        }
    },
    {
        "text": """Playground Safety:
Supervise children on playgrounds and check equipment:
- Surfaces should have at least 12 inches of protective material (wood chips, sand, mulch)
- Equipment should be well-maintained with no rust, splinters, or sharp edges
- Spacing between guardrails and protective barriers should prevent entrapment
- Teach children playground rules: take turns, no pushing, use equipment properly
- Check that equipment is age-appropriate""",
        "metadata": {
            **KNOWLEDGE_SOURCES["cpsc_safety"],
            "topic": "playground_safety",
            "age_range": "2-12",
            "section": "Outdoor Safety"
        }
    }
]


async def ingest_all_content():
    """Ingest all knowledge base content"""
    try:
        logger.info("Starting knowledge base ingestion...")

        # Combine all content
        all_content = CDC_CHILD_CARE_CONTENT + CPSC_SAFETY_CONTENT

        # Extract texts and metadata
        texts = [item["text"] for item in all_content]
        metadatas = [item["metadata"] for item in all_content]

        # Add to vector database
        logger.info(f"Adding {len(texts)} documents to knowledge base...")
        doc_ids = await rag_service.add_documents_batch(texts, metadatas)

        logger.info(f"Successfully ingested {len(doc_ids)} documents")

        # Show statistics
        stats = await rag_service.get_collection_stats()
        logger.info(f"Knowledge base stats: {stats}")

        return {
            "success": True,
            "documents_added": len(doc_ids),
            "stats": stats
        }

    except Exception as e:
        logger.error(f"Failed to ingest content: {e}", exc_info=True)
        return {
            "success": False,
            "error": str(e)
        }


async def check_knowledge_base():
    """Check if knowledge base needs to be populated"""
    stats = await rag_service.get_collection_stats()
    if stats['total_documents'] == 0:
        logger.info("Knowledge base is empty, ingesting content...")
        return await ingest_all_content()
    else:
        logger.info(f"Knowledge base already has {stats['total_documents']} documents")
        return {"success": True, "message": "Knowledge base already populated"}


if __name__ == "__main__":
    # Run ingestion
    result = asyncio.run(ingest_all_content())
    print(json.dumps(result, indent=2))
