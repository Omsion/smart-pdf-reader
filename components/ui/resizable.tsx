"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { GripVertical } from "lucide-react"
import {
  Panel,
  Group,
  Separator,
  type PanelProps,
  type GroupProps,
  type SeparatorProps,
} from "react-resizable-panels"

function ResizablePanelGroup({
  className,
  style,
  ...props
}: GroupProps) {
  return (
    <Group
      className={cn(
        // Group 内部已设置 display:flex / height:100% / width:100%，不重复添加
        "data-[orientation=vertical]:flex-col",
        className,
      )}
      style={{
        // 用 flex:1 替代库默认的 height:100%，避免 CSS 百分比高度在 flex 子元素中的兼容性问题
        height: "auto",
        width: "100%",
        flex: "1 1 0%",
        minHeight: 0,
        minWidth: 0,
        ...style,
      }}
      {...props}
    />
  )
}

function ResizablePanel(props: PanelProps) {
  return <Panel {...props} />
}

function ResizableHandle({
  withHandle,
  className,
  ...props
}: SeparatorProps & { withHandle?: boolean }) {
  return (
    <Separator
      className={cn(
        // 使用 w-2 替代 w-px，确保分隔条有足够的可点击宽度
        // react-resizable-panels v4 通过 resizeTargetMinimumSize 管理 hit area，
        // 但视觉宽度过小仍会导致难以抓取
        "relative flex w-2 cursor-col-resize items-center justify-center bg-border transition-colors hover:bg-primary/50 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring focus-visible:ring-offset-1 data-[orientation=vertical]:h-2 data-[orientation=vertical]:w-full data-[orientation=vertical]:cursor-row-resize",
        className,
      )}
      {...props}
    >
      {withHandle && (
        <div className="z-10 flex h-4 w-3 items-center justify-center rounded-sm border bg-border">
          <GripVertical className="h-2.5 w-2.5" />
        </div>
      )}
    </Separator>
  )
}

export { ResizablePanelGroup, ResizablePanel, ResizableHandle }
