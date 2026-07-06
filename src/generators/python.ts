/**
 * @license
 * Copyright 2023 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import * as Blockly from 'blockly/core';
import {Order, type PythonGenerator} from 'blockly/python';

// Export all the code generators for our custom blocks,
// but don't register them with Blockly yet.
// This file has no side effects!
export const forBlock = Object.create(null);

forBlock['add_text'] = function (
  block: Blockly.Block,
  generator: PythonGenerator,
) {
  const text = generator.valueToCode(block, 'TEXT', Order.NONE) || "''";
  return `print(${text})\n`;
};
