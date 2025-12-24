"""
Test script to verify personalization works for all experience levels
"""
import requests
import json

API_BASE = "http://localhost:8001/api"

# Test user profiles with different experience levels
test_profiles = [
    {
        "level": "Beginner",
        "profile": {
            "email": "beginner@test.com",
            "software_background": "Complete beginner, never programmed before",
            "hardware_background": "No robotics experience",
            "experience_level": "Beginner"
        }
    },
    {
        "level": "Intermediate",
        "profile": {
            "email": "intermediate@test.com",
            "software_background": "Python developer with 2 years experience",
            "hardware_background": "Arduino hobbyist with basic electronics",
            "experience_level": "Intermediate"
        }
    },
    {
        "level": "Advanced",
        "profile": {
            "email": "advanced@test.com",
            "software_background": "Senior robotics engineer with ROS2 experience",
            "hardware_background": "Extensive embedded systems and SLAM expertise",
            "experience_level": "Advanced"
        }
    }
]

sample_content = """
# Introduction to Physical AI

Physical AI combines artificial intelligence with robotic systems to create intelligent machines that can perceive, reason, and act in the physical world. This chapter covers the fundamentals of ROS 2, sensor integration, and basic navigation concepts.

## Key Topics:
- ROS 2 architecture and nodes
- Publishing and subscribing to topics
- Sensor data processing
- Basic path planning
"""

print("=" * 80)
print("TESTING PERSONALIZATION FOR ALL EXPERIENCE LEVELS")
print("=" * 80)

for test_case in test_profiles:
    level = test_case["level"]
    profile = test_case["profile"]

    print(f"\n{'='*80}")
    print(f"TESTING: {level.upper()} LEVEL")
    print(f"{'='*80}")
    print(f"Profile: {profile['software_background']}")
    print(f"Experience: {profile['experience_level']}")

    # Make personalization request
    payload = {
        "content": sample_content,
        "user_profile": profile,
        "chapter_id": "ch00-introduction"
    }

    try:
        response = requests.post(
            f"{API_BASE}/personalization/adapt",
            json=payload,
            timeout=30
        )

        if response.status_code == 200:
            data = response.json()
            personalized = data.get("personalized_content", "")
            details = data.get("adaptation_details", {})

            print(f"\n[SUCCESS] - Status: {response.status_code}")
            print(f"Adaptation Status: {details.get('status', 'N/A')}")
            print(f"Experience Level Detected: {details.get('user_experience_level', 'N/A')}")
            print(f"\nPersonalized Content Length: {len(personalized)} chars")
            print(f"\n--- PERSONALIZED ROADMAP ({level}) ---")
            print(personalized[:500] + "..." if len(personalized) > 500 else personalized)
            print("\n" + "-" * 80)

        else:
            print(f"\n[FAILED] - Status: {response.status_code}")
            print(f"Response: {response.text}")

    except Exception as e:
        print(f"\n[ERROR]: {str(e)}")

print("\n" + "=" * 80)
print("TEST COMPLETED")
print("=" * 80)
print("\nExpected Results:")
print("[OK] Beginner: Simple explanations, step-by-step, analogies")
print("[OK] Intermediate: Balanced theory/practice, assumes basic knowledge")
print("[OK] Advanced: Complex concepts, optimization, research topics")
print("=" * 80)
