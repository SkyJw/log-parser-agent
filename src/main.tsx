import { ChangeEvent, DragEvent, FormEvent, useMemo, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import {
  Activity,
  AlertTriangle,
  Bot,
  Cpu,
  FileArchive,
  HardDrive,
  ListChecks,
  MessageSquareText,
  Network,
  Play,
  RadioTower,
  ServerCog,
  ShieldCheck,
  UploadCloud,
  Zap,
} from 'lucide-react';
import './styles.css';

type LogFile = {
  name: string;
  size: number;
  type: string;
};

type AnalysisStep = {
  title: string;
  detail: string;
  status: 'pending' | 'running' | 'done';
};

const acceptedExtensions: string[] = [
  '.log',
  '.txt',
  '.zip',
  '.tar',
  '.gz',
  '.tgz',
  '.bz2',
  '.xz',
  '.7z',
  '.rar',
];

const baseSteps: AnalysisStep[] = [
  {
    title: '解包与完整性校验',
    detail: '识别 ZIP/TAR/GZ/TGZ/BZ2/XZ/7Z/RAR 等格式，校验日志包结构与关键文件。',
    status: 'pending',
  },
  {
    title: '单板环境画像',
    detail: '结合板类型、主控/单板角色、CPU 架构、版本线索生成设备上下文。',
    status: 'pending',
  },
  {
    title: '通信链路模式识别',
    detail: '聚类 RRC、SCTP、NETCONF、IPC、驱动告警与时钟同步等关键日志片段。',
    status: 'pending',
  },
  {
    title: '异常根因推理',
    detail: '关联问题描述和时间线，提取高置信异常、疑似根因、影响范围与复现线索。',
    status: 'pending',
  },
  {
    title: '修复建议生成',
    detail: '输出排查路径、风险等级、建议命令和需要补采的日志清单。',
    status: 'pending',
  },
];

const formatSize = (size: number) => {
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / 1024 / 1024).toFixed(1)} MB`;
};

const isSupportedFile = (fileName: string) => {
  const lower = fileName.toLowerCase();
  return acceptedExtensions.some((extension) => lower.endsWith(extension));
};

const features = [
  { title: '多格式日志上传', desc: '支持原始日志与 ZIP/TAR/GZ/TGZ/BZ2/XZ/7Z/RAR 压缩包。', Icon: FileArchive },
  { title: '上下文增强分析', desc: '强制问题描述，并补充板卡、角色、CPU、制式与版本信息。', Icon: MessageSquareText },
  { title: '实时 Agent 过程', desc: '点击分析后展示每个阶段的状态、进度与推理摘要。', Icon: Activity },
];

function App() {
  const [files, setFiles] = useState<LogFile[]>([]);
  const [problem, setProblem] = useState('');
  const [boardType, setBoardType] = useState('通信基带处理板');
  const [boardRole, setBoardRole] = useState('单板');
  const [cpuType, setCpuType] = useState('ARM64 / AArch64');
  const [softwareVersion, setSoftwareVersion] = useState('');
  const [networkMode, setNetworkMode] = useState('5G NR / LTE');
  const [steps, setSteps] = useState<AnalysisStep[]>(baseSteps);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const [formError, setFormError] = useState('');
  const analysisPanelRef = useRef<HTMLElement>(null);

  const uploadHint = useMemo(() => acceptedExtensions.join(' / '), []);
  const completedCount = steps.filter((step) => step.status === 'done').length;
  const progress = Math.round((completedCount / steps.length) * 100);

  const applySelectedFiles = (selectedFiles: File[]) => {
    const supported = selectedFiles.filter((file) => isSupportedFile(file.name));
    setFiles(
      supported.map((file) => ({
        name: file.name,
        size: file.size,
        type: file.type || 'compressed/log',
      })),
    );
    setFormError(
      supported.length === selectedFiles.length ? '' : '已过滤不支持的文件格式，请上传日志或常见压缩包。',
    );
  };

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    applySelectedFiles(Array.from(event.target.files ?? []));
  };

  const handleDrop = (event: DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    applySelectedFiles(Array.from(event.dataTransfer.files));
  };

  const runMockAnalysis = () => {
    setHasStarted(true);
    setIsAnalyzing(true);
    setSteps(baseSteps.map((step) => ({ ...step, status: 'pending' })));

    baseSteps.forEach((_, index) => {
      window.setTimeout(() => {
        setSteps((current) =>
          current.map((step, stepIndex) => {
            if (stepIndex < index) return { ...step, status: 'done' };
            if (stepIndex === index) return { ...step, status: 'running' };
            return { ...step, status: 'pending' };
          }),
        );
      }, index * 950);

      window.setTimeout(() => {
        setSteps((current) =>
          current.map((step, stepIndex) => (stepIndex <= index ? { ...step, status: 'done' } : step)),
        );
        if (index === baseSteps.length - 1) {
          setIsAnalyzing(false);
        }
      }, index * 950 + 720);
    });
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!problem.trim()) {
      setFormError('问题描述为必填项，请补充故障现象、发生时间或影响业务。');
      return;
    }

    if (files.length === 0) {
      setFormError('请至少上传一份日志文件或压缩包。');
      return;
    }

    setFormError('');
    analysisPanelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    runMockAnalysis();
  };

  return (
    <main className="app-shell">
      <section className="hero-section">
        <div className="hero-copy">
          <div className="eyebrow"><RadioTower size={18} /> Embedded Linux LogOps Agent</div>
          <h1>嵌入式通信 Linux 单板智能日志分析 Agent</h1>
          <p>
            面向通信基站、主控板、业务单板与底软团队的智能日志入口。上传日志包、补充故障上下文后，Agent
            将实时展示解包、关联、推理与建议生成过程。
          </p>
          <div className="hero-actions">
            <a href="#analysis-form" className="primary-link"><UploadCloud size={18} /> 立即上传日志</a>
            <span><ShieldCheck size={17} /> 支持常见压缩格式</span>
          </div>
        </div>
        <div className="hero-visual" aria-label="AI 日志分析主视觉">
          <div className="generated-orb" />
          <div className="board-card">
            <div className="chip"><Cpu size={34} /></div>
            <div>
              <strong>LINUX SBC</strong>
              <span>AI Diagnostic Core</span>
            </div>
          </div>
          <div className="signal-lines">
            <i />
            <i />
            <i />
          </div>
          <div className="floating-alert"><AlertTriangle size={18} /> 异常事件聚类中</div>
        </div>
      </section>

      <section className="feature-grid" aria-label="核心能力">
        {features.map(({ title, desc, Icon }) => (
          <article className="feature-card" key={title}>
            <Icon size={28} />
            <h3>{title}</h3>
            <p>{desc}</p>
          </article>
        ))}
      </section>

      <form id="analysis-form" className="workspace-grid" onSubmit={handleSubmit}>
        <section className="panel upload-panel">
          <div className="section-title">
            <span><UploadCloud size={22} /></span>
            <div>
              <h2>日志上传</h2>
              <p>拖拽或选择日志文件，支持常见压缩格式。</p>
            </div>
          </div>

          <label className="drop-zone" onDragOver={(event) => event.preventDefault()} onDrop={handleDrop}>
            <input
              type="file"
              multiple
              accept={acceptedExtensions.join(',')}
              onChange={handleFileChange}
            />
            <UploadCloud size={44} />
            <strong>点击选择日志文件 / 压缩包</strong>
            <span>{uploadHint}</span>
          </label>

          <div className="file-list" aria-live="polite">
            {files.length === 0 ? (
              <p className="empty-state">尚未选择文件。建议上传故障发生前后 30 分钟日志。</p>
            ) : (
              files.map((file) => (
                <div className="file-row" key={file.name}>
                  <FileArchive size={20} />
                  <div>
                    <strong>{file.name}</strong>
                    <span>{formatSize(file.size)} · {file.type}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        <section className="panel form-panel">
          <div className="section-title">
            <span><ListChecks size={22} /></span>
            <div>
              <h2>故障上下文</h2>
              <p>问题描述必填，基础信息可帮助 Agent 建立设备画像。</p>
            </div>
          </div>

          <label className="field full-width required">
            <span>问题描述</span>
            <textarea
              required
              value={problem}
              onChange={(event) => setProblem(event.target.value)}
              placeholder="例如：单板启动后 SCTP 偶发建链失败，10:24 开始业务中断，重启后短暂恢复。"
            />
          </label>

          <div className="field-row">
            <label className="field">
              <span>板类型</span>
              <select value={boardType} onChange={(event) => setBoardType(event.target.value)}>
                <option>通信基带处理板</option>
                <option>射频接口板</option>
                <option>传输交换板</option>
                <option>时钟同步板</option>
                <option>通用 Linux 单板</option>
              </select>
            </label>
            <label className="field">
              <span>单板 / 主控</span>
              <select value={boardRole} onChange={(event) => setBoardRole(event.target.value)}>
                <option>单板</option>
                <option>主控</option>
                <option>备控</option>
                <option>业务子卡</option>
              </select>
            </label>
          </div>

          <div className="field-row">
            <label className="field">
              <span>CPU 类型</span>
              <select value={cpuType} onChange={(event) => setCpuType(event.target.value)}>
                <option>ARM64 / AArch64</option>
                <option>ARMv7</option>
                <option>x86_64</option>
                <option>PowerPC</option>
                <option>MIPS</option>
              </select>
            </label>
            <label className="field">
              <span>通信制式</span>
              <select value={networkMode} onChange={(event) => setNetworkMode(event.target.value)}>
                <option>5G NR / LTE</option>
                <option>LTE</option>
                <option>WCDMA</option>
                <option>专网通信</option>
                <option>以太网交换</option>
              </select>
            </label>
          </div>

          <label className="field full-width">
            <span>软件版本 / 构建号</span>
            <input
              value={softwareVersion}
              onChange={(event) => setSoftwareVersion(event.target.value)}
              placeholder="例如：BSP_6.2.18 / kernel 5.10.x / build 20260609"
            />
          </label>

          {formError && <div className="form-error"><AlertTriangle size={18} /> {formError}</div>}

          <button className="analyze-button" type="submit" disabled={isAnalyzing}>
            <Play size={20} /> {isAnalyzing ? 'Agent 分析中...' : '开始智能分析'}
          </button>
        </section>
      </form>

      <section ref={analysisPanelRef} className="panel analysis-panel">
        <div className="analysis-header">
          <div className="section-title">
            <span><Bot size={22} /></span>
            <div>
              <h2>Agent 实时分析过程</h2>
              <p>展示从日志解包到根因推理的在线分析轨迹。</p>
            </div>
          </div>
          <div className="progress-pill">{hasStarted ? `${progress}%` : '待开始'}</div>
        </div>

        <div className="progress-bar"><span style={{ width: `${hasStarted ? progress : 0}%` }} /></div>

        <div className="agent-console">
          <div className="console-summary">
            <div><HardDrive size={20} /> 文件：{files.length || 0} 个</div>
            <div><ServerCog size={20} /> {boardType} · {boardRole}</div>
            <div><Cpu size={20} /> {cpuType}</div>
            <div><Network size={20} /> {networkMode}</div>
            <div><Zap size={20} /> {softwareVersion || '版本待补充'}</div>
          </div>

          <div className="step-list">
            {steps.map((step, index) => (
              <article className={`step-card ${step.status}`} key={step.title}>
                <div className="step-index">{index + 1}</div>
                <div>
                  <h3>{step.title}</h3>
                  <p>{step.detail}</p>
                </div>
                <span className="step-status">
                  {step.status === 'done' ? '完成' : step.status === 'running' ? '进行中' : '等待'}
                </span>
              </article>
            ))}
          </div>

          <div className="console-output" aria-live="polite">
            {!hasStarted && '等待上传日志并填写问题描述后启动 Agent。'}
            {hasStarted && isAnalyzing && 'Agent 正在实时读取日志、构建时间线并进行异常关联推理...'}
            {hasStarted && !isAnalyzing && '分析流程已完成：建议接入后端模型服务后在此处渲染根因报告、证据片段与修复建议。'}
          </div>
        </div>
      </section>
    </main>
  );
}

createRoot(document.getElementById('root')!).render(<App />);
