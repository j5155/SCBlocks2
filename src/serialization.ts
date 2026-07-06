/**
 * @license
 * Copyright 2023 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import * as Blockly from 'blockly/core';

const storageKey = 'mainWorkspace';

/**
 * Saves the state of the workspace to browser's local storage.
 * @param workspace Blockly workspace to save.
 */
export const save = function (workspace: Blockly.Workspace) {
  const data = Blockly.serialization.workspaces.save(workspace);
  window.localStorage?.setItem(storageKey, JSON.stringify(data));
};

/**
 * Loads saved state from local storage into the given workspace.
 * @param workspace Blockly workspace to load into.
 */
export const load = function (workspace: Blockly.Workspace) {
  const data = window.localStorage?.getItem(storageKey);
  if (!data) return;

  // Don't emit events during loading.
  Blockly.Events.disable();
  try {
    Blockly.serialization.workspaces.load(
      JSON.parse(data),
      workspace,
      undefined,
    );
  } catch (error) {
    // A saved workspace from an older/incompatible block set can fail to load
    // (e.g. a block referencing a variable that no longer resolves). Rather than
    // crash the whole app, drop the corrupt state and start clean.
    console.warn('Discarding incompatible saved workspace:', error);
    workspace.clear();
    window.localStorage?.removeItem(storageKey);
  } finally {
    Blockly.Events.enable();
  }
};
