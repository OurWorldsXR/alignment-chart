export type Prompt = { id: string; label: string; detail?: string }

// Working classroom copy, based on the brief's filmmaking themes. Review with
// the curriculum team before publishing as final course language.
export const prompts: Prompt[] = [
  { id: 'brainstorm', label: 'Brainstorming ideas' },
  { id: 'unstuck', label: 'Getting unstuck' },
  { id: 'first-draft', label: 'Writing a first draft' },
  { id: 'rewrite', label: 'Rewriting a scene' },
  { id: 'feedback', label: 'Giving creative feedback' },
  { id: 'research', label: 'Researching a topic' },
  { id: 'fact-check', label: 'Checking whether something is true' },
  { id: 'storyboard', label: 'Making a storyboard' },
  { id: 'artwork', label: 'Generating artwork' },
  { id: 'translation', label: 'Translating language' },
  { id: 'culture', label: 'Interpreting another culture' },
  { id: 'lived-experience', label: 'Representing lived experience' },
  { id: 'likeness', label: 'Changing someone’s likeness or voice' },
  { id: 'accessibility', label: 'Making work more accessible' },
]
