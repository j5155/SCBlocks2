<script setup lang="ts">
import * as Blockly from "blockly";
import { registerContinuousToolbox } from "@blockly/continuous-toolbox";
import { pythonGenerator } from "blockly/python";
import { computed, onBeforeUnmount, onMounted, ref } from "vue";
import { systemCoreTheme } from "./blocklyTheme";
import { blocks } from "./blocks/text";
import {
  addDevice,
  getDevices,
  onDevicesChanged,
  refreshDeviceFields,
  registerDeviceField,
  removeDevice,
  setDevices,
  updateDevice,
  type Device,
} from "./devices";
import { forBlock } from "./generators/python";
import { buildToolbox } from "./toolbox";
import {
  addExtension,
  ensureCatalogLoaded,
  getLoadedExtensions,
  isExtensionLoaded,
  registerExtensions,
  removeExtension,
} from "./extensions";
import { simpleName } from "./apiCatalog";
import {
  generateAllOpmodes,
  makeOpmodeState,
  newTabId,
  opmodeInfoFromState,
  type OpModeTab,
  type OpModeType,
  type WorkspaceState,
} from "./opmodes";

// v3: opmodes are separate hat blocks (details / setup / start / trigger), and
// motors live in a project-level registry rather than as per-tab variables.
const PROJECT_STORAGE_KEY = "opmodeProject.v3";

const blocklyDiv = ref<HTMLDivElement | null>(null);
const generatedCode = ref("");
const generationStatus = ref("Ready");

// OpMode tabs.
const tabs = ref<OpModeTab[]>([]);
const activeTabId = ref("");

// Motors (device registry) modal state. `motors` mirrors the registry so the
// modal stays reactive; the registry itself is the source of truth for codegen.
const motorsOpen = ref(false);
const motors = ref<Device[]>([]);

// Extensions picker state.
const pickerOpen = ref(false);
const pickerQuery = ref("");
const catalogClasses = ref<{ className: string; module: string }[]>([]);
const catalogLoading = ref(false);
const loadedExtensions = ref<string[]>([]);

let workspace: Blockly.WorkspaceSvg | null = null;
let suppressChanges = false;

const registerBlockly = () => {
  registerDeviceField();
  if (!Blockly.Blocks["sc_opmode_details"]) {
    Blockly.common.defineBlocks(blocks);
  }

  Object.assign(pythonGenerator.forBlock, forBlock);
};

const resizeWorkspace = () => {
  if (!workspace) return;
  Blockly.svgResize(workspace);
};

// --- Tab / opmode plumbing -------------------------------------------------

const TYPE_LABELS: Record<OpModeType, string> = {
  Teleop: "teleop",
  Auto: "autonomous",
  Utility: "utility",
};

const activeTab = () => tabs.value.find((tab) => tab.id === activeTabId.value);

const tabViews = computed(() =>
  tabs.value.map((tab) => {
    const info = opmodeInfoFromState(tab.state);
    return {
      id: tab.id,
      name: info.name,
      type: info.type,
      typeLabel: TYPE_LABELS[info.type] ?? info.type,
      enabled: info.enabled,
    };
  }),
);

const serializeWorkspace = (): WorkspaceState =>
  workspace ? Blockly.serialization.workspaces.save(workspace) : {};

const loadStateIntoWorkspace = (state: WorkspaceState) => {
  if (!workspace) return;
  suppressChanges = true;
  Blockly.Events.disable();
  try {
    workspace.clear();
    Blockly.serialization.workspaces.load(state, workspace, undefined);
  } catch (error) {
    console.warn("Failed to load opmode into workspace:", error);
    workspace.clear();
  } finally {
    Blockly.Events.enable();
    suppressChanges = false;
  }
};

// Copy the live workspace back into the active tab's stored state.
const syncActiveTab = () => {
  const tab = activeTab();
  if (tab && workspace) {
    tab.state = serializeWorkspace();
  }
};

const persistProject = () => {
  try {
    window.localStorage?.setItem(
      PROJECT_STORAGE_KEY,
      JSON.stringify({
        tabs: tabs.value,
        activeTabId: activeTabId.value,
        devices: getDevices(),
      }),
    );
  } catch (error) {
    console.warn("Failed to persist opmodes:", error);
  }
};

const generateCode = () => {
  syncActiveTab();
  const code = generateAllOpmodes(tabs.value);
  generatedCode.value =
    code.trim() || "# Add blocks to an OpMode to generate its Python class.";
  generationStatus.value = code.trim()
    ? "Python generated"
    : "Waiting for blocks";
};

const selectTab = (id: string) => {
  if (id === activeTabId.value) return;
  syncActiveTab();
  activeTabId.value = id;
  const tab = activeTab();
  if (tab) loadStateIntoWorkspace(tab.state);
  syncToolboxForActive();
  persistProject();
  generateCode();
};

const addOpmode = (type: OpModeType) => {
  syncActiveTab();
  const defaultName =
    type === "Auto"
      ? "My Autonomous"
      : type === "Utility"
        ? "My Utility"
        : "My Teleop";
  const tab: OpModeTab = {
    id: newTabId(),
    state: makeOpmodeState(type, defaultName),
  };
  tabs.value.push(tab);
  activeTabId.value = tab.id;
  loadStateIntoWorkspace(tab.state);
  syncToolboxForActive();
  persistProject();
  generateCode();
};

const deleteOpmode = (id: string) => {
  const index = tabs.value.findIndex((tab) => tab.id === id);
  if (index === -1) return;

  const wasActive = id === activeTabId.value;
  tabs.value.splice(index, 1);

  if (!tabs.value.length) {
    // Never leave the project empty.
    const tab: OpModeTab = {
      id: newTabId(),
      state: makeOpmodeState("Teleop", "My Teleop"),
    };
    tabs.value.push(tab);
    activeTabId.value = tab.id;
    loadStateIntoWorkspace(tab.state);
  } else if (wasActive) {
    const fallback = tabs.value[Math.max(0, index - 1)];
    activeTabId.value = fallback.id;
    loadStateIntoWorkspace(fallback.state);
  }

  syncToolboxForActive();
  persistProject();
  generateCode();
};

const loadProject = () => {
  const raw = window.localStorage?.getItem(PROJECT_STORAGE_KEY);
  if (raw) {
    try {
      const parsed = JSON.parse(raw) as {
        tabs?: OpModeTab[];
        activeTabId?: string;
        devices?: Device[];
      };
      if (Array.isArray(parsed.tabs) && parsed.tabs.length) {
        tabs.value = parsed.tabs;
        activeTabId.value =
          parsed.activeTabId &&
          parsed.tabs.some((t) => t.id === parsed.activeTabId)
            ? parsed.activeTabId
            : parsed.tabs[0].id;
        setDevices(Array.isArray(parsed.devices) ? parsed.devices : []);
        motors.value = [...getDevices()];
        return;
      }
    } catch (error) {
      console.warn("Discarding incompatible saved project:", error);
      window.localStorage?.removeItem(PROJECT_STORAGE_KEY);
    }
  }

  const tab: OpModeTab = {
    id: newTabId(),
    state: makeOpmodeState("Teleop", "My Teleop"),
  };
  tabs.value = [tab];
  activeTabId.value = tab.id;
};

// --- Motors (device registry) ----------------------------------------------

const openMotors = () => {
  motors.value = [...getDevices()];
  motorsOpen.value = true;
};

const closeMotors = () => {
  motorsOpen.value = false;
};

const addMotor = () => {
  addDevice();
};

const removeMotor = (id: string) => {
  removeDevice(id);
};

const onMotorName = (id: string, event: Event) => {
  updateDevice(id, { name: (event.target as HTMLInputElement).value });
};

const onMotorBus = (id: string, event: Event) => {
  updateDevice(id, {
    bus: Number((event.target as HTMLInputElement).value) || 0,
  });
};

const onMotorDeviceId = (id: string, event: Event) => {
  updateDevice(id, {
    deviceId: Number((event.target as HTMLInputElement).value) || 0,
  });
};

// --- Extensions picker -----------------------------------------------------

const openExtensionPicker = async () => {
  pickerOpen.value = true;
  if (catalogClasses.value.length) return;
  catalogLoading.value = true;
  try {
    const catalog = await ensureCatalogLoaded();
    catalogClasses.value = catalog.classes.map((cls) => ({
      className: cls.className,
      module: cls.module,
    }));
  } finally {
    catalogLoading.value = false;
  }
};

const closePicker = () => {
  pickerOpen.value = false;
  pickerQuery.value = "";
};

const filteredClasses = computed(() => {
  const query = pickerQuery.value.trim().toLowerCase();
  const matches = query
    ? catalogClasses.value.filter((cls) =>
        cls.className.toLowerCase().includes(query),
      )
    : catalogClasses.value;
  return matches.slice(0, 200);
});

const toggleExtension = (className: string) => {
  if (isExtensionLoaded(className)) {
    removeExtension(className);
  } else {
    addExtension(className);
  }
  loadedExtensions.value = getLoadedExtensions();
};

const shortName = (className: string) => simpleName(className);

// After updateToolbox(), rebuild the always-open continuous flyout from the
// newly applied categories.
type ContinuousToolboxLike = {
  getInitialFlyoutContents?: () => unknown;
  getFlyout?: () => { show: (items: unknown) => void } | null;
};

const refreshContinuousFlyout = (ws: Blockly.WorkspaceSvg) => {
  const tb = ws.getToolbox() as unknown as ContinuousToolboxLike | null;
  const flyout = tb?.getFlyout?.();
  if (tb?.getInitialFlyoutContents && flyout) {
    flyout.show(tb.getInitialFlyoutContents());
  }
};

// The Gamepad category only makes sense in Teleop opmodes (driver input isn't
// read in autonomous/utility). Rebuild the toolbox whenever the active opmode's
// type changes so the category appears/disappears. `null` forces a first build.
let gamepadShown: boolean | null = null;

const syncToolboxForActive = () => {
  if (!workspace) return;
  const tab = activeTab();
  const includeGamepad = tab
    ? opmodeInfoFromState(tab.state).type === "Teleop"
    : false;
  if (includeGamepad === gamepadShown) return;
  gamepadShown = includeGamepad;
  workspace.updateToolbox(buildToolbox({ includeGamepad }));
  refreshContinuousFlyout(workspace);
};

onMounted(() => {
  registerBlockly();

  if (!blocklyDiv.value) {
    throw new Error(`div with id 'blocklyDiv' not found`);
  }

  registerContinuousToolbox();

  // Inject with an empty toolbox first. The continuous toolbox eagerly builds
  // every category's flyout on init, including the dynamic (custom) Devices and
  // Extensions categories — so their callbacks must be registered *before* the
  // real toolbox is applied. We register them, then swap in the full toolbox.
  workspace = Blockly.inject(blocklyDiv.value, {
    toolbox: { kind: "categoryToolbox", contents: [] },
    renderer: "zelos",
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
    plugins: {
      flyoutsVerticalToolbox: "ContinuousFlyout",
      metricsManager: "ContinuousMetrics",
      toolbox: "ContinuousToolbox",
    },
  });

  registerExtensions(workspace, pythonGenerator, openExtensionPicker);

  // Keep the modal mirror, the device dropdowns and the generated code in sync
  // whenever a motor is added/renamed/removed from the Motors modal.
  onDevicesChanged(() => {
    motors.value = [...getDevices()];
    if (workspace) refreshDeviceFields(workspace);
    persistProject();
    generateCode();
  });

  // Keep the flyout at a constant size regardless of workspace zoom. By default
  // the flyout scale tracks the workspace scale (getFlyoutScale → targetWorkspace
  // scale, applied in reflowInternal_); pin it so flyout blocks stay constant.
  const flyout = workspace.getFlyout();
  if (flyout) {
    (flyout as unknown as { getFlyoutScale: () => number }).getFlyoutScale =
      () => 0.67;
  }

  // Now that every dynamic-category callback is registered, apply the real
  // toolbox (its gamepad category depends on the active opmode type, so load
  // the project first) and rebuild the (empty) continuous flyout.
  loadProject();
  syncToolboxForActive();
  const active = activeTab();
  if (active) loadStateIntoWorkspace(active.state);
  generateCode();

  workspace.addChangeListener((event: Blockly.Events.Abstract) => {
    if (
      suppressChanges ||
      event.isUiEvent ||
      event.type === Blockly.Events.FINISHED_LOADING ||
      !workspace ||
      workspace.isDragging()
    ) {
      return;
    }

    syncActiveTab();
    // A live edit to the details hat may flip the opmode type (e.g. teleop →
    // auto), which adds/removes the gamepad category.
    syncToolboxForActive();
    persistProject();
    generateCode();
  });

  window.addEventListener("resize", resizeWorkspace);
  requestAnimationFrame(resizeWorkspace);
});

onBeforeUnmount(() => {
  window.removeEventListener("resize", resizeWorkspace);
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
            <UBadge color="primary" variant="soft">OpMode Python</UBadge>
            <UButton color="neutral" variant="soft" @click="openMotors">
              Motors
            </UButton>
            <UButton
              color="neutral"
              variant="soft"
              @click="openExtensionPicker"
            >
              Extensions
            </UButton>
            <UButton color="primary" @click="generateCode">Generate</UButton>
          </div>
        </header>

        <!-- One tab per OpMode; each tab is its own workspace + hat block. -->
        <nav class="opmode-tabs" aria-label="OpModes">
          <button
            v-for="tab in tabViews"
            :key="tab.id"
            type="button"
            class="opmode-tab"
            :class="{
              'opmode-tab--active': tab.id === activeTabId,
              'opmode-tab--disabled': !tab.enabled,
            }"
            @click="selectTab(tab.id)"
          >
            <span class="opmode-tab-type" :data-type="tab.type">{{
              tab.typeLabel
            }}</span>
            <span class="opmode-tab-name">{{ tab.name }}</span>
            <span
              v-if="tabViews.length > 1"
              class="opmode-tab-close"
              role="button"
              aria-label="Delete opmode"
              @click.stop="deleteOpmode(tab.id)"
              >×</span
            >
          </button>

          <div class="opmode-add">
            <button
              type="button"
              class="opmode-add-btn"
              @click="addOpmode('Teleop')"
            >
              + Teleop
            </button>
            <button
              type="button"
              class="opmode-add-btn"
              @click="addOpmode('Auto')"
            >
              + Auto
            </button>
            <button
              type="button"
              class="opmode-add-btn"
              @click="addOpmode('Utility')"
            >
              + Utility
            </button>
          </div>
        </nav>

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


      </aside>
    </main>

    <!-- Motors: the project-level device registry. Motors added here are
         registered automatically in every opmode and appear in every motor
         block's dropdown. -->
    <div v-if="motorsOpen" class="ext-overlay" @click.self="closeMotors">
      <div class="ext-modal" role="dialog" aria-label="Manage motors">
        <header class="ext-modal-head">
          <div>
            <h2>Motors</h2>
            <p>
              Add your robot's motors once here. Each is registered automatically
              in every OpMode and can be picked from any motor block.
            </p>
          </div>
          <UButton color="neutral" variant="ghost" @click="closeMotors">
            Close
          </UButton>
        </header>

        <div v-if="!motors.length" class="ext-hint">
          No motors yet. Add one to get started.
        </div>

        <ul v-else class="ext-list">
          <li class="motor-row motor-row--head">
            <span>Name</span>
            <span>Bus</span>
            <span>Device ID</span>
            <span></span>
          </li>
          <li v-for="motor in motors" :key="motor.id" class="motor-row">
            <input
              class="ext-search motor-input"
              type="text"
              :value="motor.name"
              placeholder="motor name"
              @input="onMotorName(motor.id, $event)"
            />
            <input
              class="ext-search motor-input motor-input--num"
              type="number"
              :value="motor.bus"
              @input="onMotorBus(motor.id, $event)"
            />
            <input
              class="ext-search motor-input motor-input--num"
              type="number"
              :value="motor.deviceId"
              @input="onMotorDeviceId(motor.id, $event)"
            />
            <UButton
              size="xs"
              color="error"
              variant="soft"
              @click="removeMotor(motor.id)"
            >
              Remove
            </UButton>
          </li>
        </ul>

        <div>
          <UButton color="primary" @click="addMotor">+ Add motor</UButton>
        </div>
      </div>
    </div>

    <!-- Extensions picker: load any RobotPy class as an escape-hatch extension. -->
    <div v-if="pickerOpen" class="ext-overlay" @click.self="closePicker">
      <div class="ext-modal" role="dialog" aria-label="Load extension">
        <header class="ext-modal-head">
          <div>
            <h2>Extensions</h2>
            <p>
              Load any RobotPy class as an escape hatch. Loaded classes appear
              in the Extensions category of the toolbox.
            </p>
          </div>
          <UButton color="neutral" variant="ghost" @click="closePicker">
            Close
          </UButton>
        </header>

        <input
          v-model="pickerQuery"
          class="ext-search"
          type="search"
          placeholder="Search classes (e.g. A301, Gyro, Servo)…"
        />

        <p v-if="catalogLoading" class="ext-hint">Loading API catalog…</p>
        <ul v-else class="ext-list">
          <li
            v-for="cls in filteredClasses"
            :key="cls.className"
            class="ext-row"
          >
            <div class="ext-row-main">
              <span class="ext-row-name">{{ shortName(cls.className) }}</span>
              <span class="ext-row-path">{{ cls.className }}</span>
            </div>
            <UButton
              size="xs"
              :color="isExtensionLoaded(cls.className) ? 'error' : 'primary'"
              :variant="isExtensionLoaded(cls.className) ? 'soft' : 'solid'"
              @click="toggleExtension(cls.className)"
            >
              {{ isExtensionLoaded(cls.className) ? "Remove" : "Add" }}
            </UButton>
          </li>
        </ul>
      </div>
    </div>
  </UApp>
</template>
