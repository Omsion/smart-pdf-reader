"use client";

import { useState } from "react";
import { Eye, EyeOff, Save } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAppStore } from "@/store/useAppStore";

// 常用大模型列表
const POPULAR_MODELS = [
  { value: "kimi-k2.5", label: "Kimi K2.5" },
  { value: "kimi-k2.6", label: "Kimi K2.6" },
  { value: "mimo-v2.5", label: "MiMo-V2.5" },
  { value: "mimo-v2.5-pro", label: "MiMo-V2.5-Pro" },
  { value: "minimax-m2.5", label: "MiniMax M2.5" },
  { value: "minimax-m2.7", label: "MiniMax M2.7" },
  { value: "minimax-m3", label: "MiniMax M3" },
  { value: "qwen3.6-plus", label: "Qwen3.6 Plus" },
  { value: "qwen3.7-plus", label: "Qwen3.7 Plus" },
  { value: "qwen3.7-max", label: "Qwen3.7 Max" },
  { value: "deepseek-v4-pro", label: "DeepSeek V4 Pro" },
  { value: "deepseek-v4-flash", label: "DeepSeek V4 Flash" },
];

// 自定义模型选项的特殊 value
const CUSTOM_MODEL_VALUE = "__custom__";

// 常用 API 代理地址（与上面的模型供应商对应）
const POPULAR_BASE_URLS = [
  { value: "https://api.deepseek.com", label: "DeepSeek" },
  { value: "https://api.moonshot.cn/v1", label: "Moonshot (Kimi)" },
  { value: "https://api.stepfun.com/v1", label: "阶跃星辰 (MiMo)" },
  { value: "https://api.minimax.chat/v1", label: "MiniMax" },
  { value: "https://dashscope.aliyuncs.com/compatible-mode/v1", label: "阿里云百炼 (Qwen)" },
];

interface SettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function SettingsDialog({ open, onOpenChange }: SettingsDialogProps) {
  const userApiKey = useAppStore((s) => s.userApiKey);
  const userBaseUrl = useAppStore((s) => s.userBaseUrl);
  const selectedModel = useAppStore((s) => s.selectedModel);
  const setUserApiKey = useAppStore((s) => s.setUserApiKey);
  const setUserBaseUrl = useAppStore((s) => s.setUserBaseUrl);
  const setSelectedModel = useAppStore((s) => s.setSelectedModel);

  // 判断当前选中的模型是否在预定义列表中
  const isPresetModel = POPULAR_MODELS.some((m) => m.value === selectedModel);

  // 本地临时状态
  const [localApiKey, setLocalApiKey] = useState(userApiKey);
  const [localBaseUrl, setLocalBaseUrl] = useState(userBaseUrl);
  const [localModel, setLocalModel] = useState(
    isPresetModel ? selectedModel : CUSTOM_MODEL_VALUE,
  );
  const [customModel, setCustomModel] = useState(
    isPresetModel ? "" : selectedModel,
  );
  const [showKey, setShowKey] = useState(false);
  const [savedTip, setSavedTip] = useState(false);

  // 每次打开弹窗时，从 store 同步到本地状态
  const handleOpenChange = (open: boolean) => {
    if (open) {
      const currentIsPreset = POPULAR_MODELS.some((m) => m.value === selectedModel);
      setLocalApiKey(userApiKey);
      setLocalBaseUrl(userBaseUrl);
      setLocalModel(currentIsPreset ? selectedModel : CUSTOM_MODEL_VALUE);
      setCustomModel(currentIsPreset ? "" : selectedModel);
      setSavedTip(false);
    }
    onOpenChange(open);
  };

  const handleSave = () => {
    setUserApiKey(localApiKey.trim());
    setUserBaseUrl(localBaseUrl.trim());

    const finalModel =
      localModel === CUSTOM_MODEL_VALUE ? customModel.trim() : localModel;
    setSelectedModel(finalModel || selectedModel); // 如果自定义为空，保留原值
    setSavedTip(true);
    setTimeout(() => setSavedTip(false), 2000);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>API 设置</DialogTitle>
          <DialogDescription>
            配置您自己的 API 地址和密钥。信息将加密保存在本地浏览器中，不会上传到服务器。
          </DialogDescription>
        </DialogHeader>

        <div className="mt-4 space-y-4">
          {/* 1. API Base URL（放在最前面，先确定要连哪个服务） */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">
              API Base URL
            </label>
            <input
              type="text"
              value={localBaseUrl}
              onChange={(e) => setLocalBaseUrl(e.target.value)}
              placeholder="https://api.deepseek.com"
              list="base-url-list"
              className="w-full rounded-md border border-border bg-muted/50 px-3 py-2 text-sm outline-none focus:border-primary/50"
            />
            <datalist id="base-url-list">
              {POPULAR_BASE_URLS.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </datalist>
            <p className="text-[11px] text-muted-foreground">
              支持任意兼容 OpenAI 格式的 API 代理地址（可直接输入或从列表选择）
            </p>
          </div>

          {/* 2. API Key */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">
              API Key
            </label>
            <div className="relative">
              <input
                type={showKey ? "text" : "password"}
                value={localApiKey}
                onChange={(e) => setLocalApiKey(e.target.value)}
                placeholder="sk-xxxxxxxxxxxxxxxx"
                className="w-full rounded-md border border-border bg-muted/50 px-3 py-2 pr-10 text-sm outline-none focus:border-primary/50"
              />
              <button
                type="button"
                onClick={() => setShowKey(!showKey)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showKey ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
            <p className="text-[11px] text-muted-foreground">
              留空则使用服务器默认配置
            </p>
          </div>

          {/* 3. 模型选择（select 下拉 + 自定义输入） */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">
              模型名称
            </label>
            <select
              value={localModel}
              onChange={(e) => setLocalModel(e.target.value)}
              className="w-full rounded-md border border-border bg-muted/50 px-3 py-2 text-sm outline-none focus:border-primary/50"
            >
              {POPULAR_MODELS.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label}
                </option>
              ))}
              <option value={CUSTOM_MODEL_VALUE}>
                ✏️ 自定义模型...
              </option>
            </select>

            {/* 选中"自定义"时，显示输入框 */}
            {localModel === CUSTOM_MODEL_VALUE && (
              <input
                type="text"
                value={customModel}
                onChange={(e) => setCustomModel(e.target.value)}
                placeholder="输入模型名称，如 claude-sonnet-4-6"
                className="mt-2 w-full rounded-md border border-border bg-muted/50 px-3 py-2 text-sm outline-none focus:border-primary/50"
              />
            )}

            <p className="text-[11px] text-muted-foreground">
              从列表选择常用模型，或选择「自定义」手动输入
            </p>
          </div>
        </div>

        {/* 底部按钮 */}
        <div className="mt-6 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {savedTip && (
              <span className="text-xs text-emerald-500 animate-in fade-in">
                ✓ 已保存
              </span>
            )}
          </div>
          <button
            onClick={handleSave}
            className="inline-flex items-center gap-1.5 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            <Save className="h-4 w-4" />
            保存设置
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
