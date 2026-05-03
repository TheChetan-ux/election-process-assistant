import random

class ProceduralContentEngine:
    """
    Procedural Quiz & Flashcard Generator.
    Dynamically generates quizzes from compact Fact Templates.
    Saves megabytes of space that would have been wasted on long, hardcoded JSON files,
    maintaining the strict 10MB repository limit.
    """
    def __init__(self):
        # Master logic primes (Fact Templates) for 2026 Elections
        self.templates = [
            {
                "type": "date_fact",
                "template": "When is the {phase} of polling in {state}?",
                "states": ["West Bengal", "Kerala", "Tamil Nadu", "Puducherry"],
                "phases": ["Single Phase", "Phase 1", "Phase 2"]
            },
            {
                "type": "counting",
                "template": "On what date will the votes for the 2026 Assembly Elections be counted?",
                "options": ["May 4, 2026", "April 14, 2026", "April 29, 2026", "May 1, 2026"],
                "answer": "May 4, 2026",
                "explanation": "The Election Commission of India has scheduled the nationwide counting day for May 4, 2026."
            },
            {
                "type": "mcc_prohibition",
                "template": "Under the Model Code of Conduct (MCC), which of the following is strictly prohibited during the 2026 elections?",
                "options": [
                    "Using government transport for campaigning",
                    "Holding public rallies 48 hours before polling",
                    "Announcing new financial grants by the ruling party",
                    "All of the above"
                ],
                "answer": "All of the above",
                "explanation": "The ECI Model Code of Conduct (MCC) ensures a level playing field by strictly prohibiting the ruling party from using official machinery, announcing new grants, or campaigning in the final 48 hours."
            },
            {
                "type": "voter_eligibility",
                "template": "To vote in the upcoming {state} assembly elections, you must be a registered voter and at least __ years old.",
                "states": ["West Bengal", "Kerala", "Tamil Nadu", "Assam"],
                "options": ["18", "21", "25", "16"],
                "answer": "18",
                "explanation": "Universal adult suffrage in India guarantees voting rights to all citizens aged 18 and above."
            }
        ]

    def generate_quiz(self, num_questions=5):
        """
        Dynamically assembles and returns a specified number of unique 
        quiz questions based on the templates.
        """
        quiz = []
        # Create a pool of tasks to ensure variety
        available_templates = []
        while len(available_templates) < num_questions:
            available_templates.extend(self.templates)
        
        random.shuffle(available_templates)
        selected = available_templates[:num_questions]
        
        for template in selected:
            if template["type"] == "date_fact":
                state = random.choice(template["states"])
                phase = random.choice(template["phases"])
                question = template["template"].format(phase=phase, state=state)
                
                # Logic mapped to the ground truth data
                correct_answer = "Depends on schedule"
                options = ["April 14, 2026", "April 23, 2026", "April 29, 2026", "May 4, 2026", "Not Scheduled"]
                
                if state in ["Kerala", "Tamil Nadu", "Puducherry"]:
                    correct_answer = "April 14, 2026"
                elif state == "West Bengal" and phase == "Phase 1":
                    correct_answer = "April 23, 2026"
                elif state == "West Bengal" and phase == "Phase 2":
                    correct_answer = "April 29, 2026"
                else:
                    correct_answer = "Not Scheduled"
                
                # Ensure exactly 4 options by selecting the correct answer and 3 random others
                final_options = [correct_answer]
                other_options = [opt for opt in options if opt != correct_answer]
                final_options.extend(random.sample(other_options, 3))
                random.shuffle(final_options)
                
                quiz.append({
                    "question": question,
                    "options": final_options,
                    "correct_answer": correct_answer,
                    "explanation": f"According to the 2026 Election Commission schedule, the polling date for {state} ({phase}) is {correct_answer}."
                })
                
            elif template["type"] == "voter_eligibility":
                state = random.choice(template["states"])
                question = template["template"].format(state=state)
                options = list(template["options"])
                random.shuffle(options)
                quiz.append({
                    "question": question,
                    "options": options,
                    "correct_answer": template["answer"],
                    "explanation": template["explanation"]
                })
                
            else: # Fixed template format (counting, mcc)
                options = list(template["options"])
                random.shuffle(options)
                quiz.append({
                    "question": template["template"],
                    "options": options,
                    "correct_answer": template["answer"],
                    "explanation": template["explanation"]
                })
        
        return quiz
