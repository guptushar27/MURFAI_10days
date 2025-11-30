# Voice Shopping Assistant Design Guidelines

## Design Approach

**Selected Approach:** Design System (Material Design 3 + Voice-First Principles)

**Justification:** This is a utility-focused voice interaction application requiring clear visual feedback, accessibility, and intuitive voice state indicators. Material Design 3's emphasis on dynamic feedback and adaptive interfaces aligns perfectly with voice-driven experiences.

**Core Principle:** Voice-first interface where visual elements support and enhance the auditory conversation, never competing with it.

---

## Typography System

**Font Family:** 
- Primary: Inter (Google Fonts) - excellent readability for UI elements
- Display: Space Grotesk (Google Fonts) - for product names and emphasis

**Hierarchy:**
- Hero/Agent Name: 48px-64px, weight 600, tracking tight
- Product Names: 24px-32px, weight 500
- Agent Messages: 18px-22px, weight 400, line-height 1.6
- Price Display: 28px-36px, weight 600, tabular-nums
- Metadata (timestamps, order IDs): 14px, weight 400, opacity 70%
- Button Labels: 16px, weight 500, uppercase tracking wide

---

## Layout System

**Spacing Primitives:** Tailwind units of 2, 4, 6, 8, 12, 16, 24
- Micro spacing: 2, 4 (within components)
- Component padding: 6, 8
- Section gaps: 12, 16
- Major sections: 24

**Grid Structure:**
- Full viewport layout with centered conversation interface
- Maximum content width: 640px for conversation panel
- Product cards: max-w-sm when displaying catalog items
- Bottom action bar: full-width, fixed positioning

---

## Component Library

### A. Voice Interaction Components

**Primary Voice Interface Panel:**
- Centered card container (max-w-2xl)
- Rounded corners (rounded-3xl)
- Backdrop blur effect with semi-transparent background
- Padding: 8 on mobile, 12 on desktop
- Floating above beams background with subtle elevation

**Agent Avatar/Status Indicator:**
- Circular element (96px-128px diameter)
- Pulsing animation during agent speech (scale 1.0 to 1.05, 1.5s ease-in-out)
- Static glow effect when listening
- Positioned at top of conversation panel
- Audio waveform visualization below avatar during active speech

**Conversation Transcript Area:**
- Scrollable container (max-h-96 on mobile, max-h-[600px] on desktop)
- Message bubbles:
  - Agent messages: aligned left, padding 4-6, rounded-2xl
  - User messages: aligned right, padding 4-6, rounded-2xl
  - Timestamp below each message (text-xs, opacity 60%)
- Auto-scroll to latest message
- Subtle fade gradient at top when scrolled

### B. Call Control Interface

**Start/End Call Button:**
- Large circular button (64px-80px diameter)
- Positioned bottom-center of viewport, fixed
- Icon-only (phone icon or phone-slash)
- During call: pulsing outline animation (subtle, 2s interval)
- Clear visual state differentiation between active and inactive

**Session Status Bar:**
- Thin bar at top of viewport (h-2)
- Full-width
- Shows call duration when active
- Animated progress/pulse indicator during active session

### C. Product Display Components

**Product Card (when catalog is shown):**
- Compact card layout (p-6)
- Product image placeholder area (aspect-square, rounded-xl)
- Product name (text-xl, weight 500)
- Price (text-2xl, weight 600, tabular-nums)
- Quick attributes (size, color) as small pills (px-3 py-1, rounded-full, text-sm)
- Grid layout: 1 column mobile, 2 columns tablet (md:grid-cols-2)

**Order Confirmation Panel:**
- Expandable section below conversation
- Line items list with product name, quantity, price
- Total price emphasized (text-3xl, weight 600)
- Order ID display (monospace, text-sm)
- Timestamp

### D. Visual Feedback Elements

**Listening Indicator:**
- Subtle microphone icon near avatar
- Animated audio bars (3-5 vertical bars, varying heights, 0.3s animations)
- Positioned bottom-right of avatar circle

**Processing Indicator:**
- Minimal spinner or dot pulse animation
- Appears in message area while agent formulates response
- Small size (16px-20px), centered in message bubble space

**Error State:**
- Toast notification at top of screen
- Slides down from top (y: -100% to 0)
- Red accent border on left
- Dismiss after 4s or manual close
- Clear error icon and message

---

## Navigation & Controls

**Minimal Navigation:**
- Top-left: Session info (optional logo/branding)
- Top-right: Settings icon (volume control, accessibility options)
- No traditional navigation menu - this is a single-purpose interface

**Bottom Action Bar:**
- Fixed position, full-width
- Start/End call button (centered)
- Small helper text: "Speak naturally after agent finishes" (hidden during call)
- Subtle backdrop blur

---

## Animation Strategy

**Use Sparingly - Purpose-Driven Only:**

1. **Avatar Pulse:** Scale animation (1.0 → 1.05) during agent speech, 1.5s ease-in-out repeat
2. **Message Entry:** Slide up + fade in (y: 20px → 0, opacity: 0 → 1, 0.3s ease-out)
3. **Call Button:** Subtle pulse outline when active (scale ring 1.0 → 1.2, opacity 1 → 0, 2s repeat)
4. **Listening Bars:** Staggered height animation for audio bars (0.3s ease-in-out)

**Explicitly Avoid:**
- Page transitions
- Hover effects on text
- Complex scroll-triggered animations
- Decorative motion

---

## Accessibility Features

**Voice-First Accessibility:**
- Visual indication of all audio states (listening, speaking, processing)
- High contrast between text and backgrounds
- Focus indicators on all interactive elements (4px outline, offset 2px)
- Screen reader announcements for state changes
- Keyboard navigation: Space to start/end call, Enter to submit text fallback
- Text fallback input (hidden by default, accessible via keyboard shortcut)

**Consistent Implementation:**
- All interactive elements minimum 44px touch target
- Clear disabled states (opacity 50%, cursor not-allowed)
- Error messages read by screen readers immediately

---

## Responsive Behavior

**Mobile (base):**
- Full viewport conversation interface
- Single column product cards
- Larger touch targets (56px-64px for primary button)
- Bottom action bar sticky with 16px bottom padding

**Tablet (md: 768px+):**
- Maintain centered conversation panel (max-w-2xl)
- 2-column product grid
- Larger avatar (128px vs 96px)

**Desktop (lg: 1024px+):**
- Optional sidebar for order history (can be collapsed)
- Conversation panel remains centered
- 3-column product grid if catalog is extensive

---

## Images

**No hero image required** - The animated beams background serves as the visual foundation.

**Product Images:**
- Square aspect ratio placeholders (aspect-square)
- Rounded corners (rounded-xl)
- Display in product cards during catalog browsing
- Use placeholder service or actual product images
- Lazy load images for performance

**Avatar/Agent Icon:**
- Circular icon representing the AI agent
- Could be abstract geometric shape, microphone icon, or agent logo
- Positioned at top-center of conversation panel
- Size: 96px mobile, 128px desktop