/**
 * @license
 * Copyright 2023 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import * as Blockly from 'blockly';
import { registerContinuousToolbox } from "@blockly/continuous-toolbox";

import {blocks} from './blocks/text';
import {forBlock} from './generators/python';
import {pythonGenerator} from 'blockly/python';
import {save, load} from './serialization';
import {toolbox} from './toolbox';
import {applyScratchBlockPaletteOverrides, scratchTheme} from './blocklyTheme';
// @ts-ignore
import './index.css';

// Register the blocks and generator with Blockly
applyScratchBlockPaletteOverrides();
Blockly.common.defineBlocks(blocks);
Object.assign(pythonGenerator.forBlock, forBlock);

// Set up UI elements and inject Blockly
const codeDiv = document.getElementById('generatedCode')?.firstChild;
const blocklyDiv = document.getElementById('blocklyDiv');

if (!blocklyDiv) {
  throw new Error(`div with id 'blocklyDiv' not found`);
}

// Inject Blockly.
registerContinuousToolbox();

const ws = Blockly.inject(blocklyDiv, {
  toolbox,
  theme: scratchTheme,
  renderer: "zelos",
  plugins: {
    flyoutsVerticalToolbox: "ContinuousFlyout",
    metricsManager: "ContinuousMetrics",
    toolbox: "ContinuousToolbox",
  },
});

// This function shows the generated Python code from the workspace.
const generateCode = () => {
  const code = pythonGenerator.workspaceToCode(ws as Blockly.Workspace);
  if (codeDiv) codeDiv.textContent = code;
};

if (ws) {
  // Load the initial state from storage and generate code.
  load(ws);
  generateCode();

  // Every time the workspace changes state, save the changes to storage.
  ws.addChangeListener((e: Blockly.Events.Abstract) => {
    // UI events are things like scrolling, zooming, etc.
    // No need to save after one of these.
    if (e.isUiEvent) return;
    save(ws);
  });

  // Whenever the workspace changes meaningfully, regenerate the code.
  ws.addChangeListener((e: Blockly.Events.Abstract) => {
    // Don't run the code when the workspace finishes loading; we're
    // already running it once when the application starts.
    // Don't run the code during drags; we might have invalid state.
    if (
      e.isUiEvent ||
      e.type == Blockly.Events.FINISHED_LOADING ||
      ws.isDragging()
    ) {
      return;
    }
    generateCode();
  });
}
