# Movie Mode - Character Reference Feature

## Overview

You can now use images from your collections as **character references** when generating clips in Movie Mode. This ensures your characters appear consistently throughout your video sequence.

## How It Works

### For First Clip (Clip #1)
**Character Definition:**
- Select up to **8 images** from your collections
- These define which characters should appear in the video
- Kie AI uses these as visual references to generate the first scene

**Example:**
```
Selected Images:
- Knight character from "Medieval Collection"
- Horse from "Animals Collection"
- Forest background from "Landscapes Collection"

Prompt: "A knight riding through a forest"
Result: Video generated with YOUR specific knight, horse, and forest style
```

### For Subsequent Clips (Clip #2+)
**Automatic Continuity + Characters:**
- System automatically uses the **last frame** of the previous clip (for continuity)
- Plus your selected **character reference images** (up to 7 more)
- **Total:** 1 continuity frame + 7 character refs = 8 max references

**Example:**
```
Automatic: Last frame from Clip #1 (knight at forest edge)
+ Character Refs: Castle from "Buildings Collection"

Prompt: "The knight discovers a castle"
Result: Seamless continuation with knight + YOUR castle style
```

## Usage Guide

### Step 1: Select Collection
1. Click "👥 Character References" in the Generate New Clip panel
2. Select a collection from the dropdown
3. All generated images from that collection will appear

### Step 2: Choose Characters
1. Click images to select/deselect (max 8 for first clip, max 7 for subsequent)
2. Selected images show a purple border and checkmark
3. Counter shows how many selected (e.g., "3/8")

### Step 3: Generate Clip
1. Enter your scene description and actions
2. Click "Generate Clip"
3. Kie AI will use your character references to generate the video

## Smart Reference Combination

### First Clip
```json
{
  "reference_images": [
    "knight.jpg",
    "horse.jpg",
    "forest.jpg"
  ]
}
```
Result: Video with your specific knight, horse, and forest

### Second Clip
```json
{
  "reference_images": [
    "last_frame_from_clip_1.jpg",  // Automatic (for continuity)
    "castle.jpg"                    // Your character ref
  ]
}
```
Result: Seamless continuation + your castle style

## Best Practices

### Character Selection
✅ **Do:**
- Select main characters/objects that should appear in the scene
- Use high-quality, clear images
- Keep character references consistent across clips
- Select images that match your sequence aspect ratio

❌ **Don't:**
- Select unrelated images that won't be in the scene
- Exceed 8 references for first clip or 7 for subsequent clips
- Mix drastically different art styles

### Prompt Writing
**With Character References:**
```
Good: "The knight rides through the forest"
Why: References show which knight and forest

Bad: "A small knight with red armor rides through a dark forest"
Why: Too specific - let the references define the details
```

**Without Character References:**
```
Good: "A small knight with red armor rides through a dark forest"
Why: Detailed prompt needed without visual references
```

## Example Workflows

### Workflow 1: Consistent Character Story
**Goal:** Tell a story with the same character throughout

**Clip #1:**
- Select: `warrior.jpg`, `sword.jpg`, `village.jpg`
- Prompt: "A warrior prepares for battle in a village"
- Result: YOUR warrior with YOUR sword in YOUR village

**Clip #2:**
- Auto: Last frame from Clip #1
- Select: `battlefield.jpg`, `enemy.jpg`
- Prompt: "The warrior charges into battle"
- Result: Same warrior continues to battlefield with your enemy style

**Clip #3:**
- Auto: Last frame from Clip #2
- Select: `victory_pose.jpg`
- Prompt: "The warrior stands victorious"
- Result: Same warrior in victory pose maintaining visual continuity

### Workflow 2: Evolving Scene
**Goal:** Maintain location but change time of day

**Clip #1:**
- Select: `castle_day.jpg`, `prince.jpg`
- Prompt: "A prince walks through his castle in daylight"

**Clip #2:**
- Auto: Last frame (prince in castle)
- Select: `castle_sunset.jpg`
- Prompt: "The sun sets over the castle"

**Clip #3:**
- Auto: Last frame (castle at sunset)
- Select: `castle_night.jpg`, `stars.jpg`
- Prompt: "Night falls and stars appear"

### Workflow 3: Character Introduction
**Goal:** Introduce new characters while maintaining continuity

**Clip #1:**
- Select: `hero.jpg`, `forest.jpg`
- Prompt: "A hero walks alone through the forest"

**Clip #2:**
- Auto: Last frame (hero in forest)
- Select: `companion.jpg`, `campfire.jpg`
- Prompt: "The hero meets a companion at a campfire"
- Result: Original hero + new companion

**Clip #3:**
- Auto: Last frame (both characters at campfire)
- Select: `village.jpg`
- Prompt: "The two heroes arrive at a village"
- Result: Both characters continue together

## Technical Details

### Image Limits
- **First Clip:** 0-8 character reference images
- **Subsequent Clips:** 0-7 character refs (1 slot reserved for continuity)
- **Kie AI Maximum:** 8 total reference images

### Reference Image Priority
For subsequent clips, images are combined in this order:
1. **Last frame from previous clip** (always first - for continuity)
2. **User-selected character images** (up to 7 more)

### API Request Format
```json
{
  "video_scene": "The knight discovers a castle",
  "video_actions": "The knight pulls on the reins",
  "reference_images": [
    "https://cloudinary.com/.../last-frame.jpg",  // Auto-added
    "https://cloudinary.com/.../castle.jpg"        // User-selected
  ]
}
```

### Generation Mode
- **With References:** Kie AI uses `REFERENCE_2_VIDEO` mode
- **Without References:** Kie AI uses `PROMPT_2_VIDEO` mode

## UI Features

### Image Selector
- **Expandable Panel:** Click "Select" to show/hide
- **Collection Dropdown:** Choose which collection to browse
- **Image Grid:** 4-column grid with thumbnails
- **Selection State:** Purple border + checkmark on selected
- **Quick Remove:** Hover over selected thumbnail, click × button

### Visual Feedback
- **Counter Badge:** Shows `(3/8)` or `(5/7)` depending on clip
- **Selected Thumbnails:** Row of small previews below selector
- **Info Text:** Explains how references work for current clip

### Smart Hints
- **First Clip:** "Select up to 8 images to define the characters in your video"
- **Subsequent Clips:** "Character references will be combined with the last frame for continuity"

## Cost
**No additional cost!** Character references use the same 4 credits per clip as normal generation.

## Troubleshooting

### "Maximum 8 character reference images allowed"
- **First Clip:** You've selected 8 images (maximum)
- **Subsequent Clips:** You've selected 7 images (max, since 1 slot is for continuity)
- **Solution:** Deselect an image to make room

### "Previous clip has no last frame extracted"
- **Cause:** Previous clip's video generation hasn't completed yet
- **Solution:** Wait for previous clip to finish generating (5-10 minutes)
- **Status:** Check timeline - clip should show video thumbnail when ready

### Images don't appear in selector
- **Cause:** Collection has no generated images
- **Solution:** Go to your collection and generate some images first
- **Note:** Only collections with completed image generation show up

### Characters don't match references
- **Cause:** Prompt conflicts with references, or too many references
- **Solution:**
  - Reduce number of reference images (3-5 works best)
  - Keep prompts simple and aligned with references
  - Use clearer, high-quality reference images

## Tips for Best Results

1. **Quality Over Quantity:** 3-5 clear reference images work better than 8 cluttered ones

2. **Consistency:** Use the same character references across multiple clips for character consistency

3. **Mix References Wisely:**
   - Main character: 1-2 images
   - Supporting elements: 1-2 images
   - Background/setting: 1-2 images

4. **Aspect Ratio Match:** Select images that work well with your sequence's aspect ratio (16:9 or 9:16)

5. **Let Continuity Work:** For subsequent clips, the automatic last frame usually handles continuity - use character refs for new elements

## Examples from Community

### "Epic Battle Sequence" by @user123
- Used consistent warrior reference across 5 clips
- Changed background refs each clip (castle → battlefield → victory hall)
- Result: Seamless story with same character in different locations

### "Day to Night Timelapse" by @creator456
- Same location ref (mansion) all clips
- Changed lighting refs (morning → noon → sunset → night)
- Result: Beautiful time progression of same location

### "Character Team-Up" by @filmmaker789
- Clip 1: Hero alone (hero.jpg ref)
- Clip 2: Added sidekick (sidekick.jpg ref)
- Clip 3: Added mentor (mentor.jpg ref)
- Result: Gradual team assembly with visual continuity

---

**Last Updated:** 2026-02-16
**Feature Status:** ✅ Production Ready
