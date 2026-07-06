<script setup lang="ts">
import * as Blockly from 'blockly';
import {pythonGenerator} from 'blockly/python';
import {onBeforeUnmount, onMounted, ref} from 'vue';
import {systemCoreTheme} from './blocklyTheme';
import {blocks} from './blocks/text';
import {forBlock} from './generators/python';
import {load, save} from './serialization';
import {toolbox} from './toolbox';

const blocklyDiv = ref<HTMLDivElement | null>(null);
const generatedCode = ref('');
const generationStatus = ref('Ready');

let workspace: Blockly.WorkspaceSvg | null = null;

const registerBlockly = () => {
  if (!Blockly.Blocks['add_text']) {
    Blockly.common.defineBlocks(blocks);
  }

  Object.assign(pythonGenerator.forBlock, forBlock);
};

const resizeWorkspace = () => {
  if (!workspace) return;
  Blockly.svgResize(workspace);
};

const generateCode = () => {
  if (!workspace) return;

  const code = pythonGenerator.workspaceToCode(workspace);
  generatedCode.value =
    code.trim() || '# Drag blocks into the workspace to generate Python.';
  generationStatus.value = code.trim()
    ? 'Python generated'
    : 'Waiting for blocks';
};

const clearWorkspace = () => {
  if (!workspace) return;

  workspace.clear();
  save(workspace);
  generateCode();
};

onMounted(() => {
  registerBlockly();

  if (!blocklyDiv.value) {
    throw new Error(`div with id 'blocklyDiv' not found`);
  }

  workspace = Blockly.inject(blocklyDiv.value, {
    toolbox,
    renderer: 'zelos',
    theme: systemCoreTheme,
    trashcan: true,
    zoom: {
      controls: true,
      wheel: true,
      startScale: 0.9,
      maxScale: 2,
      minScale: 0.4,
      scaleSpeed: 1.1,
    },
  });

  load(workspace);
  generateCode();

  workspace.addChangeListener((event: Blockly.Events.Abstract) => {
    if (event.isUiEvent || !workspace) return;
    save(workspace);
  });

  workspace.addChangeListener((event: Blockly.Events.Abstract) => {
    if (
      event.isUiEvent ||
      event.type === Blockly.Events.FINISHED_LOADING ||
      !workspace ||
      workspace.isDragging()
    ) {
      return;
    }

    generateCode();
  });

  window.addEventListener('resize', resizeWorkspace);
  requestAnimationFrame(resizeWorkspace);
});

onBeforeUnmount(() => {
  window.removeEventListener('resize', resizeWorkspace);
  workspace?.dispose();
  workspace = null;
});
</script>

<template>
  <UApp>
    <main class="app-shell">
      <section class="workspace-panel" aria-label="Block workspace">
        <header class="topbar">
          <div>
            <p class="eyebrow">SystemCore Blocks</p>
            <h1>Build Python robot code with blocks</h1>
          </div>

          <div class="toolbar">
            <UBadge color="primary" variant="soft">Python generator</UBadge>
            <UButton color="primary" @click="generateCode">Generate</UButton>
            <UButton color="neutral" variant="soft" @click="clearWorkspace">
              Clear
            </UButton>
          </div>
        </header>

        <div class="blockly-frame">
          <div id="blocklyDiv" ref="blocklyDiv"></div>
        </div>
      </section>

      <aside id="inspectorPane" aria-label="Generated code and status">
        <UCard class="panel-card code-card">
          <template #header>
            <div class="panel-heading">
              <h2>Generated Python</h2>
              <UBadge color="neutral" variant="outline">Live</UBadge>
            </div>
          </template>

          <pre id="generatedCode"><code>{{ generatedCode }}</code></pre>
        </UCard>

        <UCard class="panel-card status-card">
          <template #header>
            <div class="panel-heading">
              <h2>Generator Status</h2>
              <UBadge color="success" variant="soft">{{ generationStatus }}</UBadge>
            </div>
          </template>

          <div id="generatorStatus" class="status-area">
            <p>
              The workspace is configured for Python code generation. Generated
              code is shown live above.
            </p>
          </div>
        </UCard>
      </aside>
    </main>
  </UApp>
</template>
