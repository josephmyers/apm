# Waveform & Question List Redesign Spec

## Overview

Defines the interaction between the audio waveform and question list on the Question Preparation screen.

## Waveform

### Markers

- A vertical marker is displayed at each question's start time.
- Question markers are non-draggable and non-resizable.
- Clicking in the waveform should collapse all question rows, unless the click is on a question marker (at the question start), in which case it would expand that question row.

### User Selection

- Drag on the waveform to create a selection (highlighted range).
- Only one selection can exist at a time; creating a new one removes the previous.
- Click anywhere on the waveform, outside a region, to clear the selection.

### Playback

- Play/pause button controls audio playback.
- Time display shows either the current playback position or the selection range if one exists.

## Question List

### Accordion Behavior

- Each question displays as a collapsible row showing the time label.
- Only one row can be expanded at a time; expanding a row collapses any previously expanded row.
- All rows can be collapsed.

### Waveform Synchronization

- Expanding a question row updates the waveform:
  - **Point segment** (start equals end): Moves the cursor to that time.
  - **Range segment** (start differs from end): Creates a selection spanning the question's start to end and moves the cursor to the start.
