/**
 * OpMode tabs.
 *
 * Each OpMode is its own tab with its own workspace and a single opmode hat
 * block (`sc_opmode`) at the root — rather than many opmode blocks combined in
 * one workspace. This module handles the per-tab serialized state: creating a
 * fresh opmode, reading its display info, and generating Python for every tab.
 */
import * as Blockly from 'blockly';
import {pythonGenerator} from 'blockly/python';
import {generateOpmodeClass} from './generators/python';

export const OPMODE_DETAILS_BLOCK_TYPE = 'sc_opmode_details';

const IMPORT_HEADER = [
  'import commands2',
  'import commands2.button',
  'import rev',
  'import wpilib',
  'import blocks_base_classes',
].join('\n');

export type OpModeType = 'Teleop' | 'Auto' | 'Utility';

// A Blockly workspace serialization (Blockly.serialization.workspaces.save).
export type WorkspaceState = {[key: string]: unknown};

export type OpModeTab = {
  id: string;
  state: WorkspaceState;
};

export type OpModeInfo = {
  name: string;
  type: OpModeType;
  enabled: boolean;
};

let nextId = 1;
export const newTabId = () =>
  `opmode-${Date.now().toString(36)}-${nextId++}`;

/**
 * A fresh opmode workspace: the details hat plus an "on start" hat, each an
 * independent opmode-scoped hat block. Motors are registered automatically from
 * the project registry, so there's no setup hat by default — one can be added
 * from the toolbox for advanced raw-Python setup.
 */
export const makeOpmodeState = (
  type: OpModeType,
  name: string,
): WorkspaceState => ({
  blocks: {
    languageVersion: 0,
    blocks: [
      {
        type: OPMODE_DETAILS_BLOCK_TYPE,
        x: 40,
        y: 40,
        deletable: false,
        fields: {
          TYPE: type,
          ENABLED: 'TRUE',
          NAME: name,
          GROUP: '',
          DESCRIPTION: '',
        },
      },
      {
        type: 'sc_on_start',
        x: 40,
        y: 200,
      },
    ],
  },
});

type SerializedBlock = {
  type?: string;
  fields?: {[key: string]: unknown};
};

const findDetailsBlock = (state: WorkspaceState): SerializedBlock | null => {
  const blocks = (state as {blocks?: {blocks?: SerializedBlock[]}})?.blocks
    ?.blocks;
  if (!Array.isArray(blocks)) return null;
  return (
    blocks.find((block) => block.type === OPMODE_DETAILS_BLOCK_TYPE) ?? null
  );
};

/** Reads the opmode's display info straight from its serialized details hat. */
export const opmodeInfoFromState = (state: WorkspaceState): OpModeInfo => {
  const block = findDetailsBlock(state);
  const fields = block?.fields ?? {};
  const enabled = fields.ENABLED !== false && fields.ENABLED !== 'FALSE';
  return {
    name: (fields.NAME as string) || 'OpMode',
    type: (fields.TYPE as OpModeType) || 'Teleop',
    enabled,
  };
};

type GeneratorDefinitions = {definitions_: Record<string, string>};

/**
 * Generates Python for every opmode tab. Each tab is loaded into a throwaway
 * headless workspace; its opmode-scoped hat blocks are assembled into one class
 * (see generateOpmodeClass), and the classes are joined under a single shared
 * import header (plus any imports the escape-hatch extension blocks required).
 */
export const generateAllOpmodes = (tabs: OpModeTab[]): string => {
  const classes: string[] = [];
  const extraImports = new Set<string>();

  for (const tab of tabs) {
    const temp = new Blockly.Workspace();
    try {
      Blockly.serialization.workspaces.load(tab.state, temp);
      pythonGenerator.init(temp);
      const code = generateOpmodeClass(temp, pythonGenerator).trim();
      if (code) classes.push(code);

      // Collect imports the extension (escape-hatch) blocks registered while
      // generating, e.g. `import wpimath` for an extension enum value.
      const definitions = (pythonGenerator as unknown as GeneratorDefinitions)
        .definitions_;
      for (const key of Object.keys(definitions)) {
        if (key.startsWith('import_')) extraImports.add(definitions[key]);
      }
    } catch (error) {
      console.warn(`Skipping opmode ${tab.id} during generation:`, error);
    } finally {
      temp.dispose();
    }
  }

  if (!classes.length) return '';

  const importLines = [IMPORT_HEADER];
  for (const line of extraImports) {
    if (!IMPORT_HEADER.includes(line)) importLines.push(line);
  }

  return `${importLines.join('\n')}\n\n\n${classes.join('\n\n\n')}\n`;
};
