# Redone SystemCore Blocks Interface

# Goals
- No prior knowledge necessary

Everything about the UI and the blocks themselves need to be usable by people as young as 6th grade without any programming experience.
Ideally, it should be as intuitive as Scratch or Spike Prime coding and require very little docs. 
This means the interface needs to be fully understandable without a tutorial.


- The blocks experience is highest priority. 

Converting blocks to text code should be readable and supported, but blocks coding experience should come first and foremost and should not be sacrificed for better converted code.

- Easy transition from FLL/Scratch

The interface should feel familiar to previous users of Scratch and FLL Spike Prime,
and the mental models should be preserved where possible.

For example, the color scheme should be the same, there should be direct equivalents for blocks where possible, etc.


# Non-Goals

- Support beyond MotionCore and a301.

For this initial proof of concept, attempting to support the huge range of devices that WPILib implements is unnecessary.
We can consider this after we have a basic workflow working.
Potential exception: maybe we can consider some support for common FTC things like color sensors or Pinpoint as helpers.

- Third party libraries/extensibility.

This sounds very difficult to implement, and unnecessary in a proof of concept.

- IE support

# Blockers

Wpilib Python Commandsv3 support is necessary for good async blocks.
We can do frontend work and planning without this but it would be really nice to have.