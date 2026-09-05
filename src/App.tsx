import { useState, useMemo, useCallback, useEffect } from "react";
import {
  ScanLine,
  Activity,
  AlertTriangle,
  TrendingUp,
  HelpCircle,
  RotateCcw,
  Columns2,
  History,
  Save,
  FileText,
  Sparkles,
  ArrowRight,
} from "lucide-react";
import type { IntakeData, LabTest, ParsedDocument, Provenance, User, AuditEntry } from "./types";
import {
  emptyIntake,
  parseLabText,
  detectConflicts,
  generateSummary,
  generateQuestions,
  computeDeltas,
  countProvenance,
  computeStatusWithDanger,
  generateInsight,
} from "./lib/medical";
import { PRESET_CASES, loadPresetCase } from "./presetCases";
import {
  loadUser,
  saveUser,
  loadAuditLog,
  addAuditEntry,
  loadIntake,
  saveIntake,
  loadTests,
  saveTests,
  clearSession,
} from "./lib/storage";
import { useTheme } from "./components/ThemeProvider";
import { IntakeForm } from "./components/IntakeForm";
import { Dropzone } from "./components/Dropzone";
import { MedicalRecord } from "./components/MedicalRecord";
import { ConflictPanel } from "./components/ConflictPanel";
import { AISummary, ClarificationQuestions } from "./components/AISummary";

import { LongitudinalComparison } from "./components/LongitudinalComparison";
import { AuditFooter } from "./components/AuditFooter";
import { PresetSelector } from "./components/PresetSelector";
import { LoginView } from "./components/LoginView";
import { Sidebar, type NavSection } from "./components/Sidebar";
import { ReviewDrawer } from "./components/ReviewDrawer";
import { AuditLogDrawer } from "./components/AuditLogDrawer";
import { ReportDownload } from "./components/ReportDownload";

function App() {
  const { mode } = useTheme();
  const dark = mode === "dark";

  // Auth state
  const [user, setUser] = useState<User | null>(() => loadUser());

  // Sidebar state
  const [activeSection, setActiveSection] = useState<NavSection>("dashboard");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true);

  // Core data
  const [intake, setIntake] = useState<IntakeData>(() => loadIntake() || emptyIntake);
  const [currentTests, setCurrentTests] = useState<LabTest[]>(() => loadTests() || []);
  const [previousTests, setPreviousTests] = useState<LabTest[]>([]);
  const [currentDoc, setCurrentDoc] = useState<ParsedDocument | null>(null);
  const [previousDoc, setPreviousDoc] = useState<ParsedDocument | null>(null);
  const [activeCase, setActiveCase] = useState<string | null>(null);

  // UI state
  const [reviewOpen, setReviewOpen] = useState(false);
  const [auditOpen, setAuditOpen] = useState(false);
  const [auditLog, setAuditLog] = useState<AuditEntry[]>(() => loadAuditLog());
  const [scanning, setScanning] = useState(false);
  const [savedNotice, setSavedNotice] = useState(false);
  const [aiQuestions, setAiQuestions] = useState<string[] | null>(null);

  const isClinician = user?.role === "clinician";

  // Persist intake & tests
  useEffect(() => {
    if (user) saveIntake(intake);
  }, [intake, user]);
  useEffect(() => {
    if (user) saveTests(currentTests);
  }, [currentTests, user]);

  // Audit helper
  const logAction = useCallback(
    (action: string, field?: string, oldValue?: string, newValue?: string) => {
      if (!user) return;
      const updated = addAuditEntry({
        user: user.name,
        role: user.role,
        action,
        field,
        oldValue,
        newValue,
      });
      setAuditLog(updated);
    },
    [user]
  );

  // Preset case loading
  const handlePresetSelect = useCallback(
    (caseId: string) => {
      const loaded = loadPresetCase(caseId);
      if (!loaded) return;
      setActiveCase(caseId);
      setIntake(loaded.intake);
      setCurrentTests(loaded.currentTests);
      setPreviousTests(loaded.previousTests);
      const preset = PRESET_CASES.find((c) => c.id === caseId);
      if (preset) {
        setCurrentDoc({ filename: `${caseId}_current_report.txt`, kind: "current", format: "text", rawText: preset.currentReportText });
        if (preset.previousReportText) {
          setPreviousDoc({ filename: `${caseId}_previous_report.txt`, kind: "previous", format: "text", rawText: preset.previousReportText });
        } else {
          setPreviousDoc(null);
        }
      }
      setScanning(true);
      setTimeout(() => setScanning(false), 1900);
      if (user) {
        logAction(`Loaded preset case: ${preset?.label || caseId}`);
      }
    },
    [user, logAction]
  );

  const handleReset = useCallback(() => {
    setIntake(emptyIntake);
    setCurrentTests([]);
    setPreviousTests([]);
    setCurrentDoc(null);
    setPreviousDoc(null);
    setActiveCase(null);
    clearSession();
    if (user) logAction("Reset workspace — cleared all data");
  }, [user, logAction]);

  const handleSaveProfile = useCallback(() => {
    if (!user) return;
    logAction(`Saved patient profile: ${intake.name || "Unnamed"} (${currentTests.length} tests)`);
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 2000);
    setActiveSection("ingestion");
  }, [user, logAction, intake.name, currentTests.length]);

  const handleContinueToIngestion = useCallback(() => {
    if (user) logAction(`Completed intake form for ${intake.name || "patient"}, proceeding to document ingestion`);
    setActiveSection("ingestion");
  }, [user, logAction, intake.name]);

  const handleProcessAndCheck = useCallback(() => {
    if (user) logAction(`Processed clinical data: ${currentTests.length} tests extracted, navigating to structured record`);
    setActiveSection("record");
  }, [user, logAction, currentTests.length]);

  const handleSignOut = useCallback(() => {
    saveUser(null);
    setUser(null);
    setActiveSection("dashboard");
  }, []);

  const handleLogin = useCallback((u: User) => {
    saveUser(u);
    setUser(u);
    logActionForUser(u, `${u.name} signed in to ${u.role} portal`);
  }, []);

  function logActionForUser(u: User, action: string) {
    const updated = addAuditEntry({ user: u.name, role: u.role, action });
    setAuditLog(updated);
  }

  // Text processing
  const processText = useCallback(
    (text: string, kind: "current" | "previous", dateStr?: string | null) => {
      const date = dateStr || new Date().toISOString().slice(0, 10);
      const parsed = parseLabText(text, date).map((t) => ({ ...t, source: kind }));
      if (kind === "current") {
        setCurrentTests(parsed);
        setCurrentDoc({ filename: "pasted_text.txt", kind, format: "text", rawText: text });
      } else {
        setPreviousTests(parsed);
        setPreviousDoc({ filename: "pasted_text.txt", kind, format: "text", rawText: text });
      }
      setScanning(true);
      setTimeout(() => setScanning(false), 1900);
    },
    []
  );

  const handleFile = useCallback(
    (doc: ParsedDocument, rawText: string) => {
      const date = new Date().toISOString().slice(0, 10);
      const textToParse = rawText || doc.rawText;
      if (doc.kind === "current") {
        const parsed = parseLabText(textToParse, date).map((t) => ({ ...t, source: "current" as const }));
        setCurrentTests(parsed);
        setCurrentDoc(doc);
      } else {
        const parsed = parseLabText(textToParse, date).map((t) => ({ ...t, source: "previous" as const }));
        setPreviousTests(parsed);
        setPreviousDoc(doc);
      }
      setScanning(true);
      setTimeout(() => setScanning(false), 1900);
    },
    []
  );

  // Human verification
  const handleVerify = useCallback(
    (id: string) => {
      const test = currentTests.find((t) => t.id === id);
      setCurrentTests((prev) =>
        prev.map((t) => (t.id === id ? { ...t, provenance: "HUMAN_VERIFIED" as Provenance } : t))
      );
      if (test && user) {
        logAction(`Verified field: ${test.name}`, test.name, undefined, "HUMAN_VERIFIED");
      }
    },
    [currentTests, user, logAction]
  );

  const handleEdit = useCallback(
    (id: string, value: string) => {
      const num = parseFloat(value);
      const test = currentTests.find((t) => t.id === id);
      setCurrentTests((prev) =>
        prev.map((t) => {
          if (t.id !== id) return t;
          const newVal = isNaN(num) ? null : num;
          const newStatus = newVal !== null ? computeStatusWithDanger(newVal, t.refRange, t.name) : "UNKNOWN";
          const newInsight = newVal !== null ? generateInsight(t.name, newVal, newStatus) : undefined;
          return {
            ...t,
            value: newVal,
            status: newStatus,
            insight: newInsight,
            provenance: "HUMAN_VERIFIED",
          };
        })
      );
      if (test && user) {
        logAction(
          `Modified ${test.name} value`,
          test.name,
          test.value !== null ? String(test.value) : "—",
          isNaN(num) ? "—" : String(num)
        );
      }
    },
    [currentTests, user, logAction]
  );

  const handleConfirmOverride = useCallback(
    (id: string, newValue: string) => {
      handleEdit(id, newValue);
      setReviewOpen(false);
    },
    [handleEdit]
  );

  // Computed values
  const conflicts = useMemo(() => detectConflicts(intake, currentTests), [intake, currentTests]);
  const summary = useMemo(() => generateSummary(intake, currentTests), [intake, currentTests]);
  const questions = useMemo(() => generateQuestions(intake, currentTests), [intake, currentTests]);
  const deltas = useMemo(() => computeDeltas(currentTests, previousTests), [currentTests, previousTests]);
  const auditCounts = useMemo(() => countProvenance(currentTests, intake), [currentTests, intake]);

  // Show login if not authenticated
  if (!user) {
    return <LoginView onLogin={handleLogin} />;
  }

  const cardCls = dark
    ? "rounded-2xl border border-slate-800/60 bg-slate-900/30 backdrop-blur-sm p-5"
    : "rounded-2xl border border-slate-200 bg-white p-5 shadow-sm";

  const headingCls = `text-sm font-semibold ${dark ? "text-slate-200" : "text-slate-800"}`;

  return (
    <div className={`flex h-screen overflow-hidden ${dark ? "bg-slate-950" : "bg-slate-50"}`}>
      {/* Sidebar */}
      <Sidebar
        user={user}
        activeSection={activeSection}
        onNavigate={setActiveSection}
        onSignOut={handleSignOut}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        auditCount={auditLog.length}
        conflictCount={conflicts.length}
      />

      {/* Main content area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top header */}
        <header className={`flex items-center justify-between border-b px-5 py-3 flex-shrink-0 ${
          dark ? "border-slate-800/60 bg-slate-950/80 backdrop-blur-xl" : "border-slate-200 bg-white/80 backdrop-blur-xl"
        }`}>
          <div className="flex items-center gap-3">
            <h2 className={`text-base font-bold ${dark ? "text-slate-100" : "text-slate-900"}`}>
              {activeSection === "dashboard" && "Dashboard"}
              {activeSection === "intake" && "Patient Intake"}
              {activeSection === "ingestion" && "Document Ingestion"}
              {activeSection === "record" && "Structured Medical Record"}
              {activeSection === "summary" && "AI Summary & Questions"}
              {activeSection === "conflicts" && "Conflict Detection"}
              {activeSection === "longitudinal" && "Longitudinal Comparison"}
              {activeSection === "audit" && "Audit Log"}
            </h2>
          </div>

          {/* User profile pill */}
          <div className="flex items-center gap-3">
            <button
              onClick={handleSaveProfile}
              className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                dark ? "text-slate-400 border border-slate-800 hover:border-slate-700 hover:text-slate-200"
                : "text-slate-500 border border-slate-200 hover:border-slate-300 hover:text-slate-700"
              }`}
            >
              <Save className="h-3.5 w-3.5" /> {savedNotice ? "Saved!" : "Save Profile"}
            </button>
            <button
              onClick={handleReset}
              className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                dark ? "text-slate-400 border border-slate-800 hover:border-slate-700 hover:text-slate-200"
                : "text-slate-500 border border-slate-200 hover:border-slate-300 hover:text-slate-700"
              }`}
            >
              <RotateCcw className="h-3.5 w-3.5" /> Reset
            </button>
            <div className={`flex items-center gap-2.5 rounded-full border py-1 pl-1 pr-3 ${
              dark ? "border-slate-800 bg-slate-900/50" : "border-slate-200 bg-slate-50"
            }`}>
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-brand-500 to-cyan-500 text-[10px] font-bold text-white">
                {user.avatar}
              </div>
              <div className="hidden sm:block">
                <p className={`text-xs font-semibold leading-tight ${dark ? "text-slate-200" : "text-slate-800"}`}>{user.name}</p>
                <p className="text-[10px] text-slate-500 leading-tight">
                  Demo Workspace · {user.id}
                </p>
              </div>
            </div>
          </div>
        </header>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto">
          <div className="mx-auto max-w-[1200px] px-5 py-5 space-y-5">
            {/* Dashboard section */}
            {activeSection === "dashboard" && (
              <div className="space-y-5 animate-[fadeIn_0.3s_ease]">
                <PresetSelector activeCase={activeCase} onSelect={handlePresetSelect} />

                {/* Quick stats */}
                <div className="grid gap-3 sm:grid-cols-3">
                  <StatCard icon={Activity} label="Tests Extracted" value={currentTests.length} dark={dark} />
                  <StatCard icon={AlertTriangle} label="Conflicts" value={conflicts.length} dark={dark} accent="rose" />
                  <StatCard icon={TrendingUp} label="Trend Comparisons" value={deltas.length} dark={dark} accent="cyan" />
                </div>

                {/* Quick links */}
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  <QuickLink icon={FileText} label="Patient Intake" desc="Fill intake form" onClick={() => setActiveSection("intake")} dark={dark} />
                  <QuickLink icon={ScanLine} label="Ingest Document" desc="Upload lab report" onClick={() => setActiveSection("ingestion")} dark={dark} />
                  <QuickLink icon={Activity} label="View Record" desc="Structured results" onClick={() => setActiveSection("record")} dark={dark} />
                  <QuickLink icon={History} label="Audit Log" desc={`${auditLog.length} entries`} onClick={() => setAuditOpen(true)} dark={dark} />
                </div>
              </div>
            )}

            {/* Intake section */}
            {activeSection === "intake" && (
              <div className={`${cardCls} max-w-2xl animate-[fadeIn_0.3s_ease]`}>
                <IntakeForm data={intake} onChange={setIntake} onContinue={handleContinueToIngestion} />
              </div>
            )}

            {/* Ingestion section */}
            {activeSection === "ingestion" && (
              <div className={`${cardCls} animate-[fadeIn_0.3s_ease]`}>
                <div className="mb-4 flex items-center gap-2">
                  <ScanLine className="h-4 w-4 text-cyan-400" />
                  <h2 className={headingCls}>Document Ingestion</h2>
                  <span className="text-[10px] text-slate-500 ml-1">Terminology normalization enabled</span>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <Dropzone
                    label="Current Report"
                    kind="current"
                    doc={currentDoc}
                    onFile={handleFile}
                    onPaste={(text) => {
                      const dateEl = document.getElementById("current-date") as HTMLInputElement | null;
                      processText(text, "current", dateEl?.value || null);
                    }}
                    onClear={() => { setCurrentDoc(null); setCurrentTests([]); }}
                    accent="indigo"
                    scanning={scanning}
                  />
                  <Dropzone
                    label="Previous Report (optional)"
                    kind="previous"
                    doc={previousDoc}
                    onFile={handleFile}
                    onPaste={(text) => {
                      const dateEl = document.getElementById("previous-date") as HTMLInputElement | null;
                      processText(text, "previous", dateEl?.value || null);
                    }}
                    onClear={() => { setPreviousDoc(null); setPreviousTests([]); }}
                    accent="cyan"
                    scanning={scanning}
                  />
                </div>

                <div className="mt-5 flex flex-col items-center gap-2">
                  <button
                    onClick={handleProcessAndCheck}
                    disabled={currentTests.length === 0}
                    className="group inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 py-3 px-6 text-sm font-semibold text-white shadow-lg shadow-cyan-500/20 transition-all duration-200 hover:scale-[1.02] hover:shadow-cyan-500/30 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:scale-100"
                  >
                    <ScanLine className="h-4 w-4" />
                    Process Clinical Data & Check Conflicts
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                  </button>
                  {currentTests.length === 0 && (
                    <p className="text-[11px] text-slate-500">Upload or paste a lab report above to enable processing</p>
                  )}
                </div>
              </div>
            )}

            {/* Record section */}
            {activeSection === "record" && (
              <div className={`${cardCls} animate-[fadeIn_0.3s_ease]`}>
                <div className="mb-4 flex items-center gap-2">
                  <Activity className="h-4 w-4 text-brand-500" />
                  <h2 className={headingCls}>Structured Medical Record</h2>
                  {currentTests.length > 0 && (
                    <span className={`rounded-full px-2 py-0.5 text-[10px] ${dark ? "bg-slate-800 text-slate-400" : "bg-slate-100 text-slate-500"}`}>
                      {currentTests.length} tests
                    </span>
                  )}
                </div>
                <MedicalRecord
                  tests={currentTests}
                  onEdit={isClinician ? handleEdit : undefined}
                  onVerify={isClinician ? handleVerify : undefined}
                  onOpenReview={isClinician ? () => setReviewOpen(true) : undefined}
                  canReview={isClinician && currentTests.length > 0}
                />
              </div>
            )}

            {/* Summary section */}
            {activeSection === "summary" && (
              <div className="space-y-5 animate-[fadeIn_0.3s_ease]">
                <div className={cardCls}>
                  <div className="mb-4 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Sparkles className="h-4 w-4 text-purple-400" />
                      <h2 className={headingCls}>AI Patient-Friendly Summary</h2>
                    </div>
                    <ReportDownload intake={intake} tests={currentTests} deltas={deltas} conflicts={conflicts} summary={summary} />
                  </div>
                  <AISummary summary={summary} intake={intake} tests={currentTests} onAiQuestions={setAiQuestions} />
                </div>
                <div className={cardCls}>
                  <div className="mb-4 flex items-center gap-2">
                    <HelpCircle className="h-4 w-4 text-brand-500" />
                    <h2 className={headingCls}>Context-Aware Clarification Questions</h2>
                  </div>
                  <ClarificationQuestions questions={questions} aiQuestions={aiQuestions} />
                </div>
              </div>
            )}

            {/* Conflicts section */}
            {activeSection === "conflicts" && (
              <div className={`${cardCls} animate-[fadeIn_0.3s_ease]`}>
                <div className="mb-4 flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-rose-400" />
                  <h2 className={headingCls}>Inconsistency & Conflict Detection</h2>
                  {conflicts.length > 0 && (
                    <span className={`rounded-full bg-rose-500/20 px-2 py-0.5 text-[10px] font-semibold border border-rose-500/30 ${dark ? "text-rose-300" : "text-rose-700"}`}>
                      {conflicts.length} found
                    </span>
                  )}
                </div>
                <ConflictPanel conflicts={conflicts} />
              </div>
            )}

            {/* Longitudinal section */}
            {activeSection === "longitudinal" && (
              <div className={`${cardCls} animate-[fadeIn_0.3s_ease]`}>
                <div className="mb-4 flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-cyan-400" />
                  <h2 className={headingCls}>Longitudinal Delta Comparison</h2>
                  {deltas.length > 0 && (
                    <span className={`rounded-full px-2 py-0.5 text-[10px] ${dark ? "bg-slate-800 text-slate-400" : "bg-slate-100 text-slate-500"}`}>
                      {deltas.length} matched tests
                    </span>
                  )}
                </div>
                <LongitudinalComparison rows={deltas} />
              </div>
            )}

            {/* Audit section */}
            {activeSection === "audit" && (
              <div className={`${cardCls} animate-[fadeIn_0.3s_ease]`}>
                <div className="mb-4 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <History className="h-4 w-4 text-brand-500" />
                    <h2 className={headingCls}>Audit Log Timeline</h2>
                    <span className={`rounded-full px-2 py-0.5 text-[10px] ${dark ? "bg-slate-800 text-slate-400" : "bg-slate-100 text-slate-500"}`}>
                      {auditLog.length} entries
                    </span>
                  </div>
                  <button
                    onClick={() => setAuditOpen(true)}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-brand-500/40 bg-brand-500/10 px-3 py-1.5 text-xs font-semibold text-brand-300 hover:bg-brand-500/20 transition"
                  >
                    <Columns2 className="h-3.5 w-3.5" /> Open Full Timeline
                  </button>
                </div>
                <AuditFooter counts={auditCounts} />
              </div>
            )}

            {/* Disclaimer */}
            <p className="text-center text-[11px] text-slate-500 max-w-2xl mx-auto leading-relaxed pb-4">
              MedLens is an informational tool and does not provide medical advice, diagnosis, or treatment recommendations.
              Always consult a qualified healthcare provider before making health decisions.
            </p>
          </div>
        </div>
      </div>

      {/* Drawers */}
      <ReviewDrawer
        open={reviewOpen}
        onClose={() => setReviewOpen(false)}
        tests={currentTests}
        rawText={currentDoc?.rawText || ""}
        user={user}
        onConfirmOverride={handleConfirmOverride}
      />
      <AuditLogDrawer
        open={auditOpen}
        onClose={() => setAuditOpen(false)}
        log={auditLog}
      />
    </div>
  );
}

function StatCard({ icon: Icon, label, value, dark, accent }: { icon: typeof Activity; label: string; value: number; dark: boolean; accent?: string }) {
  const color = accent === "rose" ? "text-rose-400" : accent === "cyan" ? "text-cyan-400" : "text-brand-400";
  return (
    <div className={`rounded-xl border p-4 ${dark ? "border-slate-800 bg-slate-900/40" : "border-slate-200 bg-white"}`}>
      <div className="flex items-center justify-between">
        <Icon className={`h-5 w-5 ${color}`} />
        <span className={`text-2xl font-bold tabular-nums ${dark ? "text-slate-100" : "text-slate-900"}`}>{value}</span>
      </div>
      <p className="mt-2 text-xs text-slate-500">{label}</p>
    </div>
  );
}

function QuickLink({ icon: Icon, label, desc, onClick, dark }: { icon: typeof FileText; label: string; desc: string; onClick: () => void; dark: boolean }) {
  return (
    <button
      onClick={onClick}
      className={`text-left rounded-xl border p-4 transition-all duration-200 ${
        dark ? "border-slate-800 bg-slate-900/30 hover:border-slate-700 hover:bg-slate-800/40"
        : "border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm"
      }`}
    >
      <Icon className="h-5 w-5 text-brand-500 mb-2" />
      <p className={`text-sm font-semibold ${dark ? "text-slate-200" : "text-slate-800"}`}>{label}</p>
      <p className="text-[11px] text-slate-500 mt-0.5">{desc}</p>
    </button>
  );
}

export default App;
