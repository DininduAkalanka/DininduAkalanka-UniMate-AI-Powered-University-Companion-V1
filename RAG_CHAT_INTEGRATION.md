# RAG Chat Integration Guide

## Overview
The chat screen now supports **two modes** that you can toggle between:
1. **🤖 Normal AI Mode** - Traditional intent-based routing with general AI knowledge
2. **🧠 RAG Mode** - Context-aware answers using semantic search across your personal data

## How It Works

### Toggle Button
- **Location**: Top-right corner of the chat header (next to AI avatar)
- **Icon**: `analytics-outline` (normal) → `analytics` (RAG enabled)
- **Indicator**: Green dot appears when RAG mode is active
- **Action**: Tap to switch between modes instantly

### Normal AI Mode (Default)
When RAG is **OFF** (default state):
```typescript
useRAG = false
```

**Behavior:**
- Uses `aiServiceEnhanced.ts` functions
- Intent detection routes to specialized functions:
  - `summarize` → `summarizeText()`
  - `explain` → `explainConcept()`
  - `study_tips` → `getStudyTips()`
  - `question` → `answerQuestion()`
  - `general` → `generateAIResponse()`
- **Pros**: Fast, general knowledge, works immediately
- **Cons**: No awareness of your personal tasks/courses/data

### RAG Mode (Enhanced)
When RAG is **ON**:
```typescript
useRAG = true
```

**Behavior:**
- Uses `answerWithContext()` from `ragService.ts`
- Semantic search across indexed data:
  - Tasks (titles, descriptions, categories)
  - Courses (names, instructors, schedules)
  - Study sessions (topics, notes)
- Returns context-aware answers with source citations
- **Pros**: Personalized, context-aware, references your actual data
- **Cons**: Requires indexed data to be effective

## User Experience

### First-Time RAG User
When enabling RAG for the first time, the app shows:
```
🧠 RAG Mode Enabled!

Now using semantic search across your tasks, courses, 
and study data for context-aware answers.

Tip: First time using RAG? Go to the Planner tab and 
add some tasks/courses for better context!
```

### Switching Back to Normal
When disabling RAG:
```
🤖 Normal AI Mode

Switched to normal AI mode with intent-based routing.

The AI will use its general knowledge to answer your questions.
```

### Visual Indicators

1. **Header Subtext Changes:**
   - Normal: "Powered by AI 🤖"
   - RAG: "RAG Mode 🧠"
   - Thinking: "AI is thinking..."

2. **Toggle Button:**
   - Normal: Outline icon, no indicator
   - RAG: Filled icon + green dot indicator

3. **Message Sources (RAG Only):**
   When RAG finds relevant context, responses include:
   ```
   📚 Sources:
   [1] task: Complete ML Assignment (95.3% relevant)
   [2] course: Machine Learning 101 (87.2% relevant)
   ```

## Code Implementation

### Key Changes in `chat.tsx`

#### 1. Import RAG Service
```typescript
import { answerWithContext } from '../../services/ai/ragService';
```

#### 2. Add Toggle State
```typescript
const [useRAG, setUseRAG] = useState(false);
```

#### 3. Conditional Routing in handleSend()
```typescript
if (useRAG) {
  // RAG mode: semantic search + context-aware answers
  const ragResponse = await answerWithContext(text, userId);
  response = {
    text: ragResponse.answer,
    success: true,
    sources: ragResponse.sources,
  };
  
  // Add source citations
  if (ragResponse.sources?.length > 0) {
    const citations = ragResponse.sources
      .map((src, idx) => `\n[${idx + 1}] ${src.metadata.type}: ${src.metadata.title}`)
      .join('');
    response.text += `\n\n📚 Sources:${citations}`;
  }
} else {
  // Normal mode: intent-based routing
  const intent = detectIntent(text);
  switch (intent.type) {
    // ... existing intent routing
  }
}
```

#### 4. Toggle Button in Header
```typescript
<TouchableOpacity
  onPress={() => {
    setUseRAG(!useRAG);
    Alert.alert(/* mode explanation */);
  }}
  style={styles.ragToggleButton}
>
  <Ionicons 
    name={useRAG ? 'analytics' : 'analytics-outline'} 
    size={24} 
    color="#fff" 
  />
  {useRAG && <View style={styles.ragActiveIndicator} />}
</TouchableOpacity>
```

## Usage Examples

### Example 1: General Question (No Personal Data)
**User:** "What is photosynthesis?"

**Normal Mode:** General explanation from AI knowledge base
**RAG Mode:** Same general explanation (no relevant personal data found)

**Verdict:** Both modes work equally well ✅

---

### Example 2: Personalized Question (Has Task Data)
**User:** "What are my pending machine learning tasks?"

**Normal Mode:** 
- Generic advice: "To manage ML tasks, try creating a study schedule..."
- No awareness of actual tasks

**RAG Mode:**
- Finds task: "Complete ML Assignment" (due: Dec 15)
- Finds course: "Machine Learning 101"
- Response: "You have 1 pending ML task: 'Complete ML Assignment' due Dec 15. Based on your ML 101 course schedule..."

**Verdict:** RAG mode provides personalized, actionable answers 🎯

---

### Example 3: Study Plan Request
**User:** "Create a study plan for my exams"

**Normal Mode:** 
- Generic study plan template
- No knowledge of your courses/schedule

**RAG Mode:**
- Searches courses and tasks
- Finds: "Calculus Final (Dec 20)", "Physics Midterm (Dec 18)"
- Response: "Based on your schedule, here's a personalized plan: Dec 15-17: Focus on Physics (3 days before midterm)..."

**Verdict:** RAG mode creates realistic, personalized plans 🎯

## Best Practices

### When to Use Normal Mode 🤖
- General knowledge questions
- Concept explanations (no personal context needed)
- Quick answers
- First-time users (no data indexed yet)

### When to Use RAG Mode 🧠
- Questions about YOUR tasks/courses
- Personalized study plans
- Task prioritization
- Progress tracking questions
- Any query referencing "my" data

### Maximizing RAG Effectiveness

1. **Index Your Data First**
   - Go to Planner tab → Add tasks
   - Add courses with details
   - Log study sessions
   - More data = better context

2. **Ask Specific Questions**
   - ❌ "Help me study" (too vague)
   - ✅ "What should I focus on for my calculus exam?" (specific)

3. **Reference Your Data**
   - ❌ "Study tips?" (general)
   - ✅ "What are my pending high-priority tasks?" (personal)

4. **Check Sources**
   - RAG responses show source citations
   - Verify the AI is using correct context
   - If sources seem irrelevant, rephrase question

## Technical Details

### RAG Pipeline
1. **User Query** → `answerWithContext(question, userId)`
2. **Embedding** → Convert question to 384-dim vector
3. **Search** → Find top 5 relevant items (cosine similarity)
4. **Context** → Format sources as context string
5. **AI Generation** → Generate answer using context
6. **Response** → Return answer + source citations

### Data Sources
- **Tasks**: `ragIndexer.indexTask()`
- **Courses**: `ragIndexer.indexCourse()`
- **Study Sessions**: `ragIndexer.indexStudySession()`

### Storage
- **Vector DB**: AsyncStorage (local)
- **Key**: `rag_vectors_store`
- **Max Items**: 1000 (auto-cleanup at 1100)

### Performance
- **Embedding**: ~500ms (Hugging Face API)
- **Search**: <10ms (local cosine similarity)
- **Total Latency**: ~1-2 seconds (mostly AI generation)

## Troubleshooting

### "No relevant context found"
**Cause:** No indexed data matching the query
**Solution:** 
1. Add tasks/courses in Planner tab
2. Try more general questions
3. Switch to Normal mode for general knowledge

### RAG responses seem generic
**Cause:** Query too vague or no matching data
**Solution:**
1. Be more specific in questions
2. Reference your actual tasks/courses
3. Check if data is indexed (see RAG demo screen)

### Toggle not responding
**Cause:** State not updating
**Solution:**
1. Check console for errors
2. Restart app
3. Verify `ragService.ts` is imported correctly

## Future Enhancements

- [ ] Auto-index on task/course creation
- [ ] Show indexed item count in UI
- [ ] Manual re-indexing button
- [ ] RAG settings (top-k, threshold)
- [ ] Hybrid search toggle
- [ ] Export conversation with sources
- [ ] RAG analytics dashboard

## Related Files

- **Chat Screen**: `app/(tabs)/chat.tsx`
- **RAG Service**: `services/ai/ragService.ts`
- **RAG Indexer**: `services/ai/ragIndexer.ts`
- **RAG Demo**: `app/rag-demo.tsx`
- **RAG Component**: `components/RAGChat.tsx`
- **Documentation**: `RAG_SYSTEM.md`

---

**Status**: ✅ Fully Integrated (No TypeScript errors)
**Last Updated**: December 2024
**Toggle Implementation**: Option 2 (Single screen with mode toggle)
