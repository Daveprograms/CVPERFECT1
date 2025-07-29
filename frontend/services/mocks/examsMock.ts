export interface Question {
  id: string
  question: string
  options: string[]
  correct_answer: number
  explanation: string
  category: string
  difficulty: 'easy' | 'medium' | 'hard'
  tags: string[]
}

export interface Exam {
  id: string
  title: string
  description: string
  category: string
  difficulty: 'beginner' | 'intermediate' | 'advanced'
  total_questions: number
  time_limit: number // in minutes
  questions: Question[]
  created_at: string
  updated_at: string
}

export interface ExamResult {
  id: string
  exam_id: string
  user_id: string
  score: number
  total_questions: number
  correct_answers: number
  time_taken: number // in minutes
  answers: {
    question_id: string
    selected_answer: number
    is_correct: boolean
  }[]
  created_at: string
}

export interface ExamGenerationRequest {
  category: string
  difficulty: 'beginner' | 'intermediate' | 'advanced'
  num_questions: number
  focus_areas?: string[]
}

export interface ExamGenerationResponse {
  exam: Exam
  estimated_duration: number
  topics_covered: string[]
  difficulty_distribution: {
    easy: number
    medium: number
    hard: number
  }
}

export const getExamsMockData = (): { exams: Exam[], recent_results: ExamResult[] } => {
  return {
    exams: [
      {
        id: "exam_001",
        title: "React Fundamentals",
        description: "Test your knowledge of React basics and core concepts",
        category: "Frontend Development",
        difficulty: "intermediate",
        total_questions: 20,
        time_limit: 30,
        questions: [
          {
            id: "q_001",
            question: "What is the correct way to declare a state variable in React using hooks?",
            options: [
              "const [state, setState] = useState(initialValue)",
              "const state = useState(initialValue)",
              "let state = useState(initialValue)",
              "var state = useState(initialValue)"
            ],
            correct_answer: 0,
            explanation: "useState returns an array with the current state and a function to update it. The correct syntax is const [state, setState] = useState(initialValue).",
            category: "React Hooks",
            difficulty: "easy",
            tags: ["react", "hooks", "state"]
          },
          {
            id: "q_002",
            question: "Which lifecycle method is equivalent to useEffect with an empty dependency array?",
            options: [
              "componentDidMount",
              "componentDidUpdate",
              "componentWillUnmount",
              "componentWillMount"
            ],
            correct_answer: 0,
            explanation: "useEffect(() => {}, []) runs only once after the component mounts, which is equivalent to componentDidMount.",
            category: "React Lifecycle",
            difficulty: "medium",
            tags: ["react", "lifecycle", "useEffect"]
          },
          {
            id: "q_003",
            question: "What is the purpose of the key prop in React lists?",
            options: [
              "To style the list items",
              "To help React identify which items have changed",
              "To make the list items clickable",
              "To add animations to the list"
            ],
            correct_answer: 1,
            explanation: "The key prop helps React identify which items have changed, been added, or been removed, which is essential for efficient re-rendering.",
            category: "React Lists",
            difficulty: "medium",
            tags: ["react", "lists", "performance"]
          }
        ],
        created_at: new Date(Date.now() - 86400000).toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: "exam_002",
        title: "Node.js Backend Development",
        description: "Test your knowledge of Node.js, Express, and backend concepts",
        category: "Backend Development",
        difficulty: "intermediate",
        total_questions: 25,
        time_limit: 45,
        questions: [
          {
            id: "q_004",
            question: "What is the purpose of middleware in Express.js?",
            options: [
              "To style the application",
              "To handle requests and responses between the client and server",
              "To connect to the database",
              "To serve static files only"
            ],
            correct_answer: 1,
            explanation: "Middleware functions have access to the request and response objects, and can execute code, modify the request/response, or end the request-response cycle.",
            category: "Express.js",
            difficulty: "medium",
            tags: ["nodejs", "express", "middleware"]
          },
          {
            id: "q_005",
            question: "Which method is used to handle POST requests in Express?",
            options: [
              "app.get()",
              "app.post()",
              "app.put()",
              "app.delete()"
            ],
            correct_answer: 1,
            explanation: "app.post() is used to handle POST requests in Express.js.",
            category: "Express.js",
            difficulty: "easy",
            tags: ["nodejs", "express", "http-methods"]
          }
        ],
        created_at: new Date(Date.now() - 172800000).toISOString(),
        updated_at: new Date().toISOString()
      }
    ],
    recent_results: [
      {
        id: "result_001",
        exam_id: "exam_001",
        user_id: "user_001",
        score: 85,
        total_questions: 20,
        correct_answers: 17,
        time_taken: 25,
        answers: [
          { question_id: "q_001", selected_answer: 0, is_correct: true },
          { question_id: "q_002", selected_answer: 0, is_correct: true },
          { question_id: "q_003", selected_answer: 1, is_correct: true }
        ],
        created_at: new Date(Date.now() - 86400000).toISOString()
      },
      {
        id: "result_002",
        exam_id: "exam_002",
        user_id: "user_001",
        score: 72,
        total_questions: 25,
        correct_answers: 18,
        time_taken: 40,
        answers: [
          { question_id: "q_004", selected_answer: 1, is_correct: true },
          { question_id: "q_005", selected_answer: 1, is_correct: true }
        ],
        created_at: new Date(Date.now() - 172800000).toISOString()
      }
    ]
  }
}

export const generateExamMock = (request: ExamGenerationRequest): ExamGenerationResponse => {
  const { category, difficulty, num_questions, focus_areas } = request
  
  return {
    exam: {
      id: `exam_${Date.now()}`,
      title: `${category} ${difficulty.charAt(0).toUpperCase() + difficulty.slice(1)} Exam`,
      description: `Custom ${difficulty} level exam for ${category}`,
      category,
      difficulty,
      total_questions: num_questions,
      time_limit: num_questions * 1.5,
      questions: Array.from({ length: num_questions }, (_, i) => ({
        id: `q_${Date.now()}_${i}`,
        question: `Sample question ${i + 1} for ${category}`,
        options: [
          "Option A",
          "Option B", 
          "Option C",
          "Option D"
        ],
        correct_answer: Math.floor(Math.random() * 4),
        explanation: "This is a sample explanation for the question.",
        category,
        difficulty,
        tags: focus_areas || [category.toLowerCase()]
      })),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    estimated_duration: num_questions * 1.5,
    topics_covered: focus_areas || [category],
    difficulty_distribution: {
      easy: Math.floor(num_questions * 0.3),
      medium: Math.floor(num_questions * 0.5),
      hard: Math.floor(num_questions * 0.2)
    }
  }
} 