"use client";

import React, { useMemo } from "react";
import { generateQrMatrix, renderQrSvgPath } from "@/lib/qr";

interface QrCodeProps {
  value: string;
  size?: number;
  fgColor?: string;
  bgColor?: string;
  className?: string;
  includeMargin?: boolean;
}

export function QrCode({
  value,
  size = 120,
  fgColor = "#C6FF3D",
  bgColor = "transparent",
  className = "",
  includeMargin = true,
}: QrCodeProps) {
  const { path, matrixSize } = useMemo(() => {
    try {
      const matrix = generateQrMatrix(value);
      return {
        path: renderQrSvgPath(matrix),
        matrixSize: matrix.length,
      };
    } catch {
      // Fallback 21x21 empty matrix
      return { path: "", matrixSize: 21 };
    }
  }, [value]);

  const margin = includeMargin ? 2 : 0;
  const viewBoxSize = matrixSize + margin * 2;

  return (
    <div
      className={`inline-block select-none ${className}`}
      style={{ width: size, height: size }}
      title={value}
    >
      <svg
        viewBox={`0 0 ${viewBoxSize} ${viewBoxSize}`}
        width="100%"
        height="100%"
        shapeRendering="crispEdges"
        style={{ background: bgColor }}
      >
        <g transform={`translate(${margin}, ${margin})`}>
          <path d={path} fill={fgColor} />
        </g>
      </svg>
    </div>
  );
}
