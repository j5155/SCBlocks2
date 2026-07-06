/**
 * @license
 * Copyright 2023 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import * as Blockly from 'blockly/core';
import {Order, type PythonGenerator} from 'blockly/python';
import {getA301Method} from '../generated/a301';
import {getDevice, getDevices} from '../devices';

// Export all the code generators for our custom blocks,
// but don't register them with Blockly yet.
// This file has no side effects!
export const forBlock = Object.create(null);

const pythonKeywords = new Set([
  'False',
  'None',
  'True',
  'and',
  'as',
  'assert',
  'async',
  'await',
  'break',
  'class',
  'continue',
  'def',
  'del',
  'elif',
  'else',
  'except',
  'finally',
  'for',
  'from',
  'global',
  'if',
  'import',
  'in',
  'is',
  'lambda',
  'nonlocal',
  'not',
  'or',
  'pass',
  'raise',
  'return',
  'try',
  'while',
  'with',
  'yield',
]);

const safePythonIdentifier = (value: string | null, fallback: string) => {
  const cleaned = (value || fallback)
    .trim()
    .replace(/\W+/g, '_')
    .replace(/^_+|_+$/g, '');
  const identifier = cleaned || fallback;
  const withValidStart = /^\d/.test(identifier) ? `motor_${identifier}` : identifier;
  return pythonKeywords.has(withValidStart) ? `${withValidStart}_value` : withValidStart;
};

const deviceName = (block: Blockly.Block, _generator: PythonGenerator) => {
  const deviceId = block.getFieldValue('DEVICE');
  return getDevice(deviceId)?.name || 'drive_motor';
};

const deviceReference = (block: Blockly.Block, generator: PythonGenerator) =>
  `self.${safePythonIdentifier(deviceName(block, generator), 'drive_motor')}`;

const valueToCode = (
  block: Blockly.Block,
  generator: PythonGenerator,
  inputName: string,
  fallback: string,
) => generator.valueToCode(block, inputName, Order.NONE) || fallback;

const compactStatementLines = (code: string) =>
  code
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);

const indentLines = (lines: string[], spaces: number) => {
  const indent = ' '.repeat(spaces);
  return lines.map((line) => `${indent}${line}`).join('\n');
};

const stripCommandComma = (line: string) => line.replace(/,\s*$/, '');

const percentToThrottle = (power: string) =>
  `max(-1, min(1, (${power}) / 100.0))`;

const instantCommand = (pythonCall: string) =>
  `commands2.InstantCommand(lambda: ${pythonCall}),\n`;

const methodCall = (block: Blockly.Block, generator: PythonGenerator) => {
  const method = getA301Method(block.getFieldValue('METHOD'));
  const args = (block.getFieldValue('ARGS') || '').trim();
  return `${deviceReference(block, generator)}.${method.name}(${args})`;
};

const commandLinesForStatement = (
  block: Blockly.Block,
  generator: PythonGenerator,
  inputName: string,
) => compactStatementLines(generator.statementToCode(block, inputName));

const commandGroupExpression = (commands: string[]) => {
  const commandExpressions = commands.map(stripCommandComma);
  if (!commandExpressions.length) {
    return 'commands2.InstantCommand(lambda: None)';
  }
  return `commands2.SequentialCommandGroup(${commandExpressions.join(', ')})`;
};

const pascalCaseIdentifier = (value: string | null, fallback: string) => {
  const words = (value || '')
    .split(/[^A-Za-z0-9]+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1));
  const identifier = words.join('');
  const safe = /^[A-Za-z_]/.test(identifier) ? identifier : `Op${identifier}`;
  return safe || fallback;
};

const OPMODE_TYPE_TO_DECORATOR: Record<string, string> = {
  Teleop: 'Teleop',
  Auto: 'Auto',
  Utility: 'Utility',
};

// The opmode hats don't emit code on their own; the class is assembled from all
// of them together by generateOpmodeClass(). Register no-ops so a stray
// workspaceToCode() never throws on them.
forBlock['sc_opmode_details'] = () => '';
forBlock['sc_on_setup'] = () => '';
forBlock['sc_on_start'] = () => '';
forBlock['sc_trigger'] = () => '';

const GAMEPAD_BLOCK_TYPES = [
  'sc_gamepad_button',
  'sc_gamepad_axis',
  'sc_gamepad_trigger',
] as const;

// Gamepad dropdown value ('1' / '2') → Driver Station port (0 / 1).
const gamepadPort = (block: Blockly.Block) =>
  block.getFieldValue('GAMEPAD') === '2' ? '1' : '0';

// Gamepads are owned by the shared user-controls helper the runtime provides
// (blocks_base_classes.DefaultUserControls), not instantiated per opmode; reads
// reach them by port. See ../../systemcore-blocks-interface user_controls.py.
const gamepadReference = (block: Blockly.Block) =>
  `self.userControls.getGamepad(${gamepadPort(block)})`;

const usesGamepad = (workspace: Blockly.Workspace) =>
  GAMEPAD_BLOCK_TYPES.some(
    (type) => workspace.getBlocksByType(type, false).length > 0,
  );

const buildTriggerLines = (
  triggers: Blockly.Block[],
  generator: PythonGenerator,
) => {
  if (!triggers.length) return [];
  const lines = ['        self.triggers = []'];
  triggers.forEach((trigger, index) => {
    const condition = valueToCode(trigger, generator, 'CONDITION', 'False');
    const mode =
      trigger.getFieldValue('MODE') === 'whileTrue' ? 'whileTrue' : 'onTrue';
    const commands = commandLinesForStatement(trigger, generator, 'COMMANDS');
    const name = `trigger_${index + 1}`;
    lines.push(
      `        ${name} = commands2.button.Trigger(lambda: ${condition})`,
      `        ${name}.${mode}(${commandGroupExpression(commands)})`,
      `        self.triggers.append(${name})`,
    );
  });
  return lines;
};

/**
 * Assembles a single OpMode Python class from all of the opmode-scoped hat
 * blocks in the given workspace: the details hat (config + decorators), any
 * setup hats, any "on start" hats, and any trigger hats. Imports are emitted
 * once by the caller (see src/opmodes.ts).
 */
export const generateOpmodeClass = (
  workspace: Blockly.Workspace,
  generator: PythonGenerator,
): string => {
  const details = workspace.getBlocksByType('sc_opmode_details', false)[0];
  const type = details?.getFieldValue('TYPE') || 'Teleop';
  const enabled = details ? details.getFieldValue('ENABLED') === 'TRUE' : true;
  const name = (details?.getFieldValue('NAME') || '').trim();
  const group = (details?.getFieldValue('GROUP') || '').trim();
  const description = (details?.getFieldValue('DESCRIPTION') || '').trim();
  const className = pascalCaseIdentifier(name, 'MyOpMode');

  const setupLines: string[] = [];
  for (const hat of workspace.getBlocksByType('sc_on_setup', false)) {
    setupLines.push(
      ...compactStatementLines(generator.statementToCode(hat, 'SETUP')),
    );
  }

  const startCommands: string[] = [];
  for (const hat of workspace.getBlocksByType('sc_on_start', false)) {
    startCommands.push(...commandLinesForStatement(hat, generator, 'COMMANDS'));
  }

  const triggerLines = buildTriggerLines(
    workspace.getBlocksByType('sc_trigger', false),
    generator,
  );

  const decorators: string[] = [];
  if (enabled) {
    decorators.push(
      `@blocks_base_classes.${OPMODE_TYPE_TO_DECORATOR[type] || 'Teleop'}`,
    );
    if (name) {
      decorators.push(`@blocks_base_classes.Name('${name.replace(/'/g, "\\'")}')`);
    }
    if (group) {
      decorators.push(`@blocks_base_classes.Group('${group.replace(/'/g, "\\'")}')`);
    }
  }

  const startBody: string[] = [];
  // Every motor in the project registry is constructed automatically at the top
  // of start(); there is no per-opmode "register motor" block anymore.
  for (const device of getDevices()) {
    const motor = safePythonIdentifier(device.name, 'drive_motor');
    startBody.push(`        self.${motor} = rev.A301(${device.bus}, ${device.deviceId})`);
  }
  if (usesGamepad(workspace)) {
    startBody.push(
      '        self.userControls = blocks_base_classes.DefaultUserControls()',
    );
  }
  if (setupLines.length) startBody.push(indentLines(setupLines, 8));
  if (triggerLines.length) startBody.push(...triggerLines);
  startBody.push(
    '        self.main_command = ' + commandGroupExpression(startCommands),
  );
  startBody.push('        self.main_command.schedule()');

  const lines = [
    ...(description ? [`# ${description}`] : []),
    ...decorators,
    `class ${className}(wpilib.OpModeRobot):`,
    '    def start(self):',
    ...startBody,
    '',
    '    def periodic(self):',
    '        commands2.CommandScheduler.getInstance().run()',
    '',
    '    def end(self):',
    '        if self.main_command:',
    '            self.main_command.cancel()',
    '            self.main_command = None',
  ];

  return lines.join('\n');
};

forBlock['sc_motor_set_power'] = function (
  block: Blockly.Block,
  generator: PythonGenerator,
) {
  const power = valueToCode(block, generator, 'POWER', '0');
  return instantCommand(`${deviceReference(block, generator)}.setThrottle(${percentToThrottle(power)})`);
};

forBlock['sc_motor_run_for_seconds'] = function (
  block: Blockly.Block,
  generator: PythonGenerator,
) {
  const motor = deviceReference(block, generator);
  const power = valueToCode(block, generator, 'POWER', '50');
  const seconds = valueToCode(block, generator, 'SECONDS', '1');
  return [
    'commands2.SequentialCommandGroup(',
    `commands2.InstantCommand(lambda: ${motor}.setThrottle(${percentToThrottle(power)})), `,
    `commands2.WaitCommand(${seconds}), `,
    `commands2.InstantCommand(lambda: ${motor}.setThrottle(0))`,
    '),\n',
  ].join('');
};

forBlock['sc_motor_stop'] = function (
  block: Blockly.Block,
  generator: PythonGenerator,
) {
  return instantCommand(`${deviceReference(block, generator)}.setThrottle(0)`);
};

forBlock['sc_motor_set_velocity'] = function (
  block: Blockly.Block,
  generator: PythonGenerator,
) {
  const velocity = valueToCode(block, generator, 'VELOCITY', '0');
  return instantCommand(`${deviceReference(block, generator)}.setVelocity(${velocity})`);
};

forBlock['sc_motor_set_position'] = function (
  block: Blockly.Block,
  generator: PythonGenerator,
) {
  const position = valueToCode(block, generator, 'POSITION', '0');
  return instantCommand(`${deviceReference(block, generator)}.setPosition(${position})`);
};

forBlock['sc_wait_seconds'] = function (
  block: Blockly.Block,
  generator: PythonGenerator,
) {
  const seconds = valueToCode(block, generator, 'SECONDS', '1');
  return `commands2.WaitCommand(${seconds}),\n`;
};

forBlock['sc_repeat_commands'] = function (
  block: Blockly.Block,
  generator: PythonGenerator,
) {
  const times = valueToCode(block, generator, 'TIMES', '2');
  const innerCommands = compactStatementLines(
    generator.statementToCode(block, 'COMMANDS'),
  ).map(stripCommandComma);
  const sequence = innerCommands.length
    ? innerCommands.join(', ')
    : 'commands2.InstantCommand(lambda: None)';

  return `commands2.SequentialCommandGroup(*[commands2.SequentialCommandGroup(${sequence}) for _ in range(int(${times}))]),\n`;
};

forBlock['sc_parallel_commands'] = function (
  block: Blockly.Block,
  generator: PythonGenerator,
) {
  const firstCommands = commandLinesForStatement(block, generator, 'FIRST');
  const secondCommands = commandLinesForStatement(block, generator, 'SECOND');
  return `commands2.ParallelCommandGroup(${commandGroupExpression(firstCommands)}, ${commandGroupExpression(secondCommands)}),\n`;
};

forBlock['sc_race_commands'] = function (
  block: Blockly.Block,
  generator: PythonGenerator,
) {
  const firstCommands = commandLinesForStatement(block, generator, 'FIRST');
  const secondCommands = commandLinesForStatement(block, generator, 'SECOND');
  return `commands2.ParallelRaceGroup(${commandGroupExpression(firstCommands)}, ${commandGroupExpression(secondCommands)}),\n`;
};

forBlock['sc_wait_until'] = function (
  block: Blockly.Block,
  generator: PythonGenerator,
) {
  const condition = valueToCode(block, generator, 'CONDITION', 'False');
  return `commands2.WaitUntilCommand(lambda: ${condition}),\n`;
};

forBlock['sc_a301_sensor_value'] = function (
  block: Blockly.Block,
  generator: PythonGenerator,
) {
  const motor = deviceReference(block, generator);
  const sensor = block.getFieldValue('SENSOR');
  const expressions: Record<string, string> = {
    ABSOLUTE_POSITION: `${motor}.getAbsoluteEncoderPosition().get()`,
    BUS_VOLTAGE: `${motor}.getBusVoltage().get()`,
    CURRENT: `${motor}.getMotorCurrent().get()`,
    POSITION: `${motor}.getRelativeEncoderPosition().get()`,
    POWER: `(${motor}.getThrottle() * 100)`,
    TEMPERATURE: `${motor}.getMotorTemperature().get()`,
    VELOCITY: `${motor}.getEncoderVelocity().get()`,
  };

  return [expressions[sensor] || expressions.VELOCITY, Order.FUNCTION_CALL];
};

forBlock['sc_gamepad_button'] = function (block: Blockly.Block) {
  const button = block.getFieldValue('BUTTON');
  const state = block.getFieldValue('STATE');
  const suffix = state === 'Held' ? '' : state;
  return [
    `${gamepadReference(block)}.get${button}Button${suffix}()`,
    Order.FUNCTION_CALL,
  ];
};

forBlock['sc_gamepad_axis'] = function (block: Blockly.Block) {
  const axis = block.getFieldValue('AXIS');
  return [`${gamepadReference(block)}.get${axis}()`, Order.FUNCTION_CALL];
};

forBlock['sc_gamepad_trigger'] = function (block: Blockly.Block) {
  const side = block.getFieldValue('SIDE');
  return [
    `${gamepadReference(block)}.get${side}TriggerAxis()`,
    Order.FUNCTION_CALL,
  ];
};

forBlock['sc_a301_advanced_call'] = function (
  block: Blockly.Block,
  generator: PythonGenerator,
) {
  return instantCommand(methodCall(block, generator));
};

forBlock['sc_a301_advanced_value'] = function (
  block: Blockly.Block,
  generator: PythonGenerator,
) {
  return [methodCall(block, generator), Order.FUNCTION_CALL];
};

forBlock['sc_python_setup_line'] = function (block: Blockly.Block) {
  const code = (block.getFieldValue('CODE') || '').trim();
  return code ? `${code}\n` : 'pass\n';
};
