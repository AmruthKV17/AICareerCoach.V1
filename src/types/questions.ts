export interface InterviewQuestions {
  expected_keywords: string[];
  difficulty: string;
  topic: string;
  items: {
    'technical-questions': string[];
    'behavioral-questions': string[];
    'situational-questions': string[];
  };
}

// Dummy data for testing purposes
export const dummyInterviewData: InterviewQuestions = {
  expected_keywords: [
    "React Native",
    "TypeScript",
    "REST APIs",
    "hooks",
    "React Navigation",
    "Context",
    "Redux",
    "Axios",
    "AsyncStorage",
    "Git",
    "ESLint",
    "Prettier"
  ],
  difficulty: "easy",
  topic: "React Native Development Intern",
  items: {
    'technical-questions': [
      "Can you explain how you have implemented functional components and hooks in React Native in your previous projects?",
      "What is your experience with consuming REST APIs in React Native applications, and how do you handle loading and error states?",
      "How do you manage state in a React Native application, and can you provide examples of using Context or Redux?",
      "Describe your familiarity with TypeScript in the context of React Native. How do you use it for props and state typing?",
      "What tools and processes do you use for version control in your projects, particularly with Git?",
      "Have you integrated local storage in your React Native apps? Explain your approach using AsyncStorage."
    ],
    'behavioral-questions': [
      "Can you provide an example of a time when you worked collaboratively with a design or backend team? What was your role?",
      "Describe a situation where you faced a challenging problem in your project. How did you approach solving it?",
      "How do you prioritize attention to detail in your coding practices, especially when working on a team?",
      "What does a flexible work environment mean to you, and how do you manage your time effectively in such settings?"
    ],
    'situational-questions': [
      "Imagine you are assigned to fix a bug in a React Native application. How would you approach this task?",
      "If you were asked to implement navigation and basic deep links in a project, what steps would you take?",
      "How would you handle a situation where you need to submit an app to the store but encounter issues during the build process?",
      "In a project where you need to implement offline capabilities, how would you approach the design and implementation of the user interface?"
    ]
  }
};