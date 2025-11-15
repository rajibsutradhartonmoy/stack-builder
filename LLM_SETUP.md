# LLM Integration Guide

Stack Builder now supports **AI-powered prompt interpretation** using Anthropic's Claude! This dramatically improves the app's ability to understand natural language requests.

## 🤖 With AI vs 📝 Without AI

### Without AI (Pattern Matching)
✅ Works out of the box
✅ No API key needed
✅ Free
❌ Limited to exact command patterns
❌ Can't understand variations or complex requests

**Example commands:**
- `create a todo app` ✅
- `add dueDate` ✅
- `make a todo application` ❌ (won't understand)
- `add a field for tracking when tasks are due` ❌ (too complex)

### With AI (Claude)
✅ Understands natural language
✅ Handles variations and typos
✅ Can infer intent from context
✅ Smarter field type detection
✅ Better error messages
✅ Automatically falls back to patterns if needed

**Example commands:**
- `create a todo app` ✅
- `make a todo application` ✅
- `build me a task manager` ✅
- `add a field for tracking when tasks are due` ✅
- `I need a deadline property` ✅
- `can you add priority levels?` ✅

## 🚀 Quick Setup

### 1. Get an Anthropic API Key

1. Go to [https://console.anthropic.com/](https://console.anthropic.com/)
2. Sign up or log in
3. Navigate to **API Keys**
4. Create a new key
5. Copy the key (starts with `sk-ant-`)

### 2. Add to Your Environment

Create a `.env.local` file in the project root:

```bash
ANTHROPIC_API_KEY=sk-ant-api03-your-key-here
```

**Or** set it in your shell:

```bash
export ANTHROPIC_API_KEY=sk-ant-api03-your-key-here
npm run dev
```

### 3. Restart the Server

```bash
# Stop the current server (Ctrl+C)
npm run dev
```

You should see:
```
🤖 Using Claude AI for prompt interpretation
```

## 💰 Pricing

Anthropic Claude pricing (as of 2024):
- **Claude 3.5 Sonnet:** $3 per million input tokens, $15 per million output tokens
- **Typical request:** ~500 tokens = $0.0015 per request
- **Very affordable** for development and prototyping

**Free tier:** New accounts get $5 in free credits

## 🧪 Testing the Integration

### Test 1: Natural Language
```
"I want to build a blog platform"
```
Should create a Blog entity with title, content, and published fields.

### Test 2: Variations
```
"let me add an author name"
"can you include a publish date?"
"need a field for featured image URL"
```

### Test 3: Complex Requests
```
"create a recipe app with ingredients, cooking time, and difficulty level"
```

Should intelligently create:
- `ingredients` (string)
- `cookingTime` (number)
- `difficulty` (string)

### Test 4: Fallback
Remove your API key and try:
```
"create a todo app"
```
Should still work with pattern matching!

## 🔧 How It Works

```typescript
// lib/orchestrator/interpretPrompt.ts
export async function interpretPrompt(prompt, blueprint) {
  if (isLLMAvailable()) {
    // Use Claude AI
    return await interpretPromptWithLLM(prompt, blueprint)
  } else {
    // Fall back to pattern matching
    return interpretWithPatterns(prompt, blueprint)
  }
}
```

### System Prompt (to Claude)

The LLM receives instructions to:
1. Understand the user's intent
2. Modify the blueprint JSON
3. Infer sensible field types
4. Add default fields (like `id`)
5. Return structured JSON response

### Example LLM Exchange

**User:** `"add a priority field for urgency"`

**Claude receives:**
```json
{
  "current_blueprint": { "entities": [{ "name": "Todo", "fields": [...] }] },
  "user_request": "add a priority field for urgency"
}
```

**Claude returns:**
```json
{
  "success": true,
  "message": "Added 'priority' field of type string to Todo entity",
  "updatedBlueprint": {
    "entities": [{
      "name": "Todo",
      "fields": [
        { "name": "id", "type": "string" },
        { "name": "title", "type": "string" },
        { "name": "completed", "type": "boolean" },
        { "name": "priority", "type": "string" }
      ]
    }]
  }
}
```

## 🐛 Troubleshooting

### API Key Not Working

**Check:**
```bash
# In your terminal
echo $ANTHROPIC_API_KEY

# Should output: sk-ant-api03-...
```

**Or check in code:**
```typescript
console.log('API Key set:', !!process.env.ANTHROPIC_API_KEY)
```

### Still Using Pattern Matching

**Server logs should show:**
```
🤖 Using Claude AI for prompt interpretation
```

If you see:
```
📝 Using pattern matching (set ANTHROPIC_API_KEY for AI)
```

Then your API key isn't being detected. Make sure:
1. `.env.local` file is in the project root
2. Server was restarted after adding the key
3. No typos in the variable name

### Rate Limits

If you hit rate limits:
- Claude has generous limits
- For development, you're unlikely to hit them
- If needed, add retry logic or use a different model

### Errors in Console

**"Invalid API key":**
- Check your key is correct
- Verify it's active in the Anthropic console

**"Model not found":**
- Update the model name in `interpretPromptWithLLM.ts`
- Current model: `claude-3-5-sonnet-20241022`

## 📊 Comparison

| Feature | Pattern Matching | Claude AI |
|---------|-----------------|-----------|
| Setup | Instant | 5 minutes |
| Cost | Free | ~$0.002/request |
| Understanding | Exact matches | Natural language |
| Flexibility | Low | High |
| Error handling | Limited | Intelligent |
| Field inference | Basic | Advanced |

## 🎯 Best Practices

1. **Start with AI:** If you have an API key, use it!
2. **Test without AI:** Ensure fallback works for users without keys
3. **Monitor costs:** Check usage in Anthropic console
4. **Provide examples:** Show users what commands work well
5. **Handle errors gracefully:** The system automatically falls back to patterns

## 🔮 Future Enhancements

- [ ] Support for OpenAI GPT-4
- [ ] Custom system prompts per project
- [ ] Learning from user corrections
- [ ] Multi-turn conversations
- [ ] Entity relationships understanding
- [ ] UI mockup generation
- [ ] Code explanation feature

## 📝 Example Session

```
User: "create a recipe sharing app"
AI: ✅ Created Recipe entity with: title, ingredients, instructions, cookingTime, servings

User: "add difficulty rating and cuisine type"
AI: ✅ Added difficulty (string) and cuisineType (string) fields

User: "the difficulty should be a number from 1-5"
AI: ✅ Changed difficulty field type to number

User: "add vegetarian flag"
AI: ✅ Added vegetarian field of type boolean
```

## 🎉 You're Ready!

With LLM integration, Stack Builder becomes a powerful AI-assisted development tool. Try it out and see how much more natural the building experience becomes!

**Need help?** Check the server logs for detailed information about what's happening behind the scenes.
