export const greetPrompt = (name: string) => ({
  messages: [{
    role: "user" as const,
    content: {
      type: "text" as const,
      text: `Please greet ${name}`
    }
  }]
});
