export type Prompt = { id: string; label: string; detail?: string }

// Current filmmaking labels from the shared curriculum document. They remain
// subject to curriculum review; keep IDs stable for saved/exported responses.
export const prompts: Prompt[] = [
  { id: 'brainstorm', label: 'Brainstorming possibilities' },
  { id: 'unstuck', label: 'Getting unstuck' },
  { id: 'first-draft', label: 'Writing a first draft' },
  { id: 'rewrite', label: 'Rewriting your work' },
  { id: 'feedback', label: 'Giving creative feedback' },
  { id: 'research', label: 'Finding background information' },
  { id: 'fact-check', label: 'Checking whether something is true' },
  { id: 'culture', label: 'Interpreting another culture' },
  { id: 'lived-experience', label: 'Representing lived experience' },
  { id: 'translation', label: 'Translating language' },
  { id: 'storyboard', label: 'Creating a storyboard' },
  { id: 'production-planning', label: 'Planning production' },
  { id: 'concept-images', label: 'Generating concept images' },
  { id: 'final-artwork', label: 'Generating final artwork' },
  { id: 'likeness', label: 'Changing someone’s image or voice' },
  { id: 'accessibility', label: 'Making work more accessible' },
]
