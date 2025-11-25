import { MODE_CONFIGS, type LearningMode, type Concept } from "@/lib/tutor-content"
import tutorContent from "@/shared-data/day4_tutor_content.json"

const QUIZ_ANSWERS: Record<string, { question: string; answer: string; explanation: string }[]> = {
  variables: [
    {
      question: "What will be stored in the variable after running `let x = 10; x = x + 5;`?",
      answer: "15",
      explanation: "The variable x starts at 10, then x + 5 = 15 is assigned back to x.",
    },
    {
      question: "What keyword creates a variable that cannot be reassigned in JavaScript?",
      answer: "const",
      explanation: "The 'const' keyword creates a constant variable that cannot be reassigned after initialization.",
    },
  ],
  loops: [
    {
      question: "If you have `for(let i=0; i<3; i++) { console.log(i); }`, what numbers will be printed?",
      answer: "0, 1, 2",
      explanation: "The loop starts at i=0, runs while i<3, and increments by 1 each time.",
    },
    {
      question: "Which loop should you use when you don't know how many times to repeat?",
      answer: "while",
      explanation:
        "A while loop is best when you don't know the exact count - it continues until a condition becomes false.",
    },
  ],
  functions: [
    {
      question: "What is returned when you call `function double(n) { return n * 2; } double(7);`?",
      answer: "14",
      explanation: "The function double takes 7 and returns 7 * 2 = 14.",
    },
    {
      question: "What do we call the values passed into a function?",
      answer: "arguments",
      explanation: "Values passed into a function are called arguments (or parameters when defining the function).",
    },
  ],
  conditionals: [
    {
      question:
        "What will this output? `let score = 85; if(score >= 90) { console.log('A'); } else if(score >= 80) { console.log('B'); }`",
      answer: "B",
      explanation: "Since score is 85, it's not >= 90 but IS >= 80, so 'B' is printed.",
    },
    {
      question: "What operator checks if two values are equal in JavaScript?",
      answer: "===",
      explanation: "The triple equals (===) checks both value and type equality.",
    },
  ],
  arrays: [
    {
      question: "Given `let colors = ['red', 'blue', 'green']`, what does `colors[1]` return?",
      answer: "blue",
      explanation: "Arrays are zero-indexed: colors[0]='red', colors[1]='blue', colors[2]='green'.",
    },
    {
      question: "What method adds an item to the end of an array?",
      answer: "push",
      explanation: "The push() method adds one or more elements to the end of an array.",
    },
  ],
}

const askedQuestions: Record<string, number> = {}

function getNextQuestion(topic: string): { question: string; answer: string; explanation: string } | null {
  const questions = QUIZ_ANSWERS[topic]
  if (!questions || questions.length === 0) return null

  const askedIndex = askedQuestions[topic] || 0
  const question = questions[askedIndex % questions.length]
  askedQuestions[topic] = (askedIndex + 1) % questions.length
  return question
}

function evaluateAnswer(
  userAnswer: string,
  correctAnswer: string,
  explanation: string,
): { isCorrect: boolean; feedback: string } {
  const answer = userAnswer.toLowerCase().trim()
  const correct = correctAnswer.toLowerCase().trim()

  const isCorrect =
    answer.includes(correct) ||
    correct.includes(answer) ||
    answer.replace(/[,\s]/g, "").includes(correct.replace(/[,\s]/g, "")) ||
    (correct === "0, 1, 2" && answer.includes("0") && answer.includes("1") && answer.includes("2")) ||
    (correct === "15" && answer.includes("15")) ||
    (correct === "14" && answer.includes("14")) ||
    (correct === "const" && answer.includes("const")) ||
    (correct === "while" && answer.includes("while")) ||
    (correct === "arguments" && (answer.includes("argument") || answer.includes("parameter"))) ||
    (correct === "b" && answer === "b") ||
    (correct === "===" && answer.includes("===")) ||
    (correct === "blue" && answer.includes("blue")) ||
    (correct === "push" && answer.includes("push"))

  if (isCorrect) {
    return {
      isCorrect: true,
      feedback: `Correct! Well done! ${explanation} Would you like another question? Pick a topic: variables, loops, functions, conditionals, or arrays!`,
    }
  } else {
    return {
      isCorrect: false,
      feedback: `Not quite! The correct answer is: ${correctAnswer}. ${explanation} Don't worry - learning from mistakes is part of the process! Try another topic?`,
    }
  }
}

const learnResponses: Record<string, string[]> = {
  variables: [
    "Variables are containers that store data values. In programming, you create a variable with a name and assign it a value, like `let age = 25`. The variable 'age' now holds the number 25. Would you like to know about different variable types like let, const, and var?",
    "Great question about variables! There are three ways to declare them in JavaScript: `var` (old way), `let` (for values that change), and `const` (for values that stay the same). For example: `const pi = 3.14159`. What else would you like to learn?",
    "You can also change variable values! If you have `let count = 0`, you can later do `count = count + 1` or `count++` to increase it. This is super useful in loops! Want to explore another topic?",
  ],
  loops: [
    "Loops repeat code multiple times. A for loop runs a set number of times: `for(let i=0; i<5; i++) { console.log(i); }` prints 0,1,2,3,4. Use for loops when you know exactly how many times to repeat. Want to learn about while loops?",
    "While loops continue until a condition is false: `while(count > 0) { count--; }`. They're perfect when you don't know how many iterations you need. There's also do-while which runs at least once! Any other questions?",
    "You can control loops with `break` (exit immediately) and `continue` (skip to next iteration). For example: `if(i === 5) break;` stops the loop when i equals 5. What topic interests you next?",
  ],
  functions: [
    "Functions are reusable blocks of code. Define with `function greet(name) { return 'Hello ' + name; }` and call with `greet('Alice')`. They help organize code and avoid repetition. Want to learn about parameters and return values?",
    "Functions can take multiple parameters and return values: `function add(a, b) { return a + b; }`. You can also use arrow functions: `const add = (a, b) => a + b;`. They're shorter and popular in modern JavaScript!",
    "Functions can call other functions! This is called composition. `function welcome(name) { return greet(name) + '! Nice to meet you.'; }`. It's powerful for building complex programs. What else interests you?",
  ],
  conditionals: [
    "Conditionals make decisions in code. `if(age >= 18) { console.log('Adult'); } else { console.log('Minor'); }` runs different code based on conditions. The condition must be true or false. Want to learn about else-if?",
    "You can chain conditions with else-if: `if(score >= 90) { grade = 'A'; } else if(score >= 80) { grade = 'B'; } else { grade = 'C'; }`. Only one block runs - the first true condition! Any questions?",
    "There's also the ternary operator for short conditions: `let status = age >= 18 ? 'Adult' : 'Minor';`. And switch statements for many options! What would you like to explore next?",
  ],
  arrays: [
    "Arrays store multiple values: `let fruits = ['apple', 'banana', 'orange']`. Access by index (starting at 0): `fruits[0]` is 'apple'. Get length with `fruits.length`. Want to learn about array methods?",
    "Useful array methods: `push()` adds to end, `pop()` removes from end, `shift()` removes from start, `unshift()` adds to start. Example: `fruits.push('grape')` adds grape to the array!",
    "You can loop through arrays with forEach: `fruits.forEach(fruit => console.log(fruit))`. Or use map to transform: `fruits.map(f => f.toUpperCase())` makes all uppercase! What else interests you?",
  ],
}

const explainedIndex: Record<string, number> = {}

function getLearnResponse(topic: string): string {
  const responses = learnResponses[topic]
  if (!responses) {
    return "I'd be happy to explain that! Pick a specific topic: variables, loops, functions, conditionals, or arrays, and I'll give you a detailed explanation."
  }

  const index = explainedIndex[topic] || 0
  const response = responses[index]
  explainedIndex[topic] = (index + 1) % responses.length
  return response
}

const teachBackPrompts: Record<string, string[]> = {
  variables: [
    "Great topic! Please teach me about variables. What are they and why do we need them in programming?",
    "Now explain to me: what's the difference between let, const, and var? When would you use each?",
    "Can you teach me how to change a variable's value? Give me an example!",
  ],
  loops: [
    "I want to learn about loops! Can you explain the difference between for and while loops?",
    "Teach me: when would you choose a while loop over a for loop? Give me a real example!",
    "Can you explain how break and continue work in loops? I'm curious!",
  ],
  functions: [
    "Please teach me about functions! Why are they useful and how do you create one?",
    "Explain parameters and return values to me. How do they work in functions?",
    "Can you teach me about arrow functions? How are they different from regular functions?",
  ],
  conditionals: [
    "Teach me about if-else statements! How do they help us make decisions in code?",
    "Can you explain else-if chains? When would you use them?",
    "I heard about something called a ternary operator. Can you teach me what it is?",
  ],
  arrays: [
    "Please teach me about arrays! What are they and why would I use one?",
    "Can you teach me some useful array methods? I want to learn how to add and remove items.",
    "How do you loop through an array? Teach me the different ways!",
  ],
}

const teachBackIndex: Record<string, number> = {}

function getTeachBackPrompt(topic: string): string {
  const prompts = teachBackPrompts[topic]
  if (!prompts) {
    return "I'm ready to learn from you! Pick a topic - variables, loops, functions, conditionals, or arrays - and teach me about it!"
  }

  const index = teachBackIndex[topic] || 0
  const prompt = prompts[index]
  teachBackIndex[topic] = (index + 1) % prompts.length
  return prompt
}

export async function POST(req: Request) {
  let mode: LearningMode = "learn"
  let message = ""
  let conceptId: string | undefined
  let conversationHistory: Array<{ role: string; content: string }> = []
  let waitingForAnswer = false
  let currentTopic = ""
  let currentQuestion = ""
  let currentAnswer = ""

  try {
    const body = await req.json()
    mode = body.mode || "learn"
    message = body.message || ""
    conceptId = body.conceptId
    conversationHistory = body.conversationHistory || []
    waitingForAnswer = body.waitingForAnswer || false
    currentTopic = body.currentTopic || ""
    currentQuestion = body.currentQuestion || ""
    currentAnswer = body.currentAnswer || ""

    console.log(
      "[v0] Chat request - mode:",
      mode,
      "message:",
      message,
      "waitingForAnswer:",
      waitingForAnswer,
      "currentTopic:",
      currentTopic,
    )

    const modeConfig = MODE_CONFIGS[mode]
    const concepts = tutorContent as Concept[]
    const lowerMessage = message.toLowerCase()

    let detectedTopic = ""
    if (lowerMessage.includes("variable")) detectedTopic = "variables"
    else if (lowerMessage.includes("loop") || lowerMessage.includes("for") || lowerMessage.includes("while"))
      detectedTopic = "loops"
    else if (lowerMessage.includes("function")) detectedTopic = "functions"
    else if (lowerMessage.includes("condition") || lowerMessage.includes("if")) detectedTopic = "conditionals"
    else if (lowerMessage.includes("array") || lowerMessage.includes("list")) detectedTopic = "arrays"

    let currentConcept = conceptId ? concepts.find((c) => c.id === conceptId) : null
    if (detectedTopic) {
      currentConcept = concepts.find((c) => c.id === detectedTopic) || currentConcept
    }

    if (mode === "quiz") {
      if (waitingForAnswer && currentTopic && currentAnswer) {
        // User is answering a question
        const evaluation = evaluateAnswer(message, currentAnswer, "")
        const quizData = QUIZ_ANSWERS[currentTopic]
        const questionData = quizData?.find((q) => q.answer.toLowerCase() === currentAnswer.toLowerCase())

        return Response.json({
          response: evaluation.isCorrect
            ? `Correct! Excellent work! ${questionData?.explanation || ""} Ready for another question? Pick a topic!`
            : `Not quite! The correct answer is: ${currentAnswer}. ${questionData?.explanation || ""} Try another topic?`,
          concept: currentConcept,
          voice: modeConfig?.voice || "Alicia",
          voiceId: modeConfig?.voiceId || "en-US-alicia",
          waitingForAnswer: false,
          currentTopic: "",
          currentQuestion: "",
          currentAnswer: "",
          isCorrect: evaluation.isCorrect,
        })
      } else if (detectedTopic) {
        // User selected a topic - ask a question
        const questionData = getNextQuestion(detectedTopic)
        if (questionData) {
          return Response.json({
            response: `Great choice! Here's your question about ${detectedTopic}: ${questionData.question}`,
            concept: concepts.find((c) => c.id === detectedTopic),
            voice: modeConfig?.voice || "Alicia",
            voiceId: modeConfig?.voiceId || "en-US-alicia",
            waitingForAnswer: true,
            currentTopic: detectedTopic,
            currentQuestion: questionData.question,
            currentAnswer: questionData.answer,
          })
        }
      }
      // Default quiz response
      return Response.json({
        response: "Pick a topic to get a question: variables, loops, functions, conditionals, or arrays!",
        concept: currentConcept,
        voice: modeConfig?.voice || "Alicia",
        voiceId: modeConfig?.voiceId || "en-US-alicia",
        waitingForAnswer: false,
        currentTopic: "",
        currentQuestion: "",
        currentAnswer: "",
      })
    }

    if (mode === "learn") {
      if (detectedTopic) {
        const response = getLearnResponse(detectedTopic)
        return Response.json({
          response,
          concept: concepts.find((c) => c.id === detectedTopic),
          voice: modeConfig?.voice || "Matthew",
          voiceId: modeConfig?.voiceId || "en-US-matthew",
        })
      }
      // Default learn response
      return Response.json({
        response:
          "I'm here to help you learn! What topic interests you? We can explore variables, loops, functions, conditionals, or arrays. Just ask about any of them!",
        concept: currentConcept,
        voice: modeConfig?.voice || "Matthew",
        voiceId: modeConfig?.voiceId || "en-US-matthew",
      })
    }

    if (mode === "teach_back") {
      if (detectedTopic) {
        const prompt = getTeachBackPrompt(detectedTopic)
        return Response.json({
          response: prompt,
          concept: concepts.find((c) => c.id === detectedTopic),
          voice: modeConfig?.voice || "Ken",
          voiceId: modeConfig?.voiceId || "en-US-ken",
        })
      }
      // If user is explaining (no topic keyword), encourage them
      if (message.length > 20 && !detectedTopic) {
        const encouragements = [
          "That's a great explanation! You clearly understand the concept. Can you give me a specific example in code?",
          "Nice job teaching! I'm learning a lot. What other aspects of this topic should I know about?",
          "Excellent! You explained that well. Would you like to teach me about another topic?",
          "I think I'm getting it! Your explanation is helpful. Can you tell me when I would use this in a real program?",
        ]
        return Response.json({
          response: encouragements[Math.floor(Math.random() * encouragements.length)],
          concept: currentConcept,
          voice: modeConfig?.voice || "Ken",
          voiceId: modeConfig?.voiceId || "en-US-ken",
        })
      }
      // Default teach back response
      return Response.json({
        response:
          "I'm your student today! Pick a topic to teach me: variables, loops, functions, conditionals, or arrays. Explain it like I'm a beginner!",
        concept: currentConcept,
        voice: modeConfig?.voice || "Ken",
        voiceId: modeConfig?.voiceId || "en-US-ken",
      })
    }

    // Fallback
    return Response.json({
      response: "I'm here to help! Pick a topic: variables, loops, functions, conditionals, or arrays.",
      concept: currentConcept,
      voice: "Matthew",
      voiceId: "en-US-matthew",
    })
  } catch (error) {
    console.error("[v0] Chat API error:", error)
    const modeConfig = MODE_CONFIGS[mode]
    return Response.json({
      response:
        "I'd love to help you learn! Please pick a topic: variables, loops, functions, conditionals, or arrays.",
      voice: modeConfig?.voice || "Matthew",
      voiceId: modeConfig?.voiceId || "en-US-matthew",
      waitingForAnswer: false,
      currentTopic: "",
      currentQuestion: "",
      currentAnswer: "",
    })
  }
}
