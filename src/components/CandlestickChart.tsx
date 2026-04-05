import React, { useEffect, useRef, useMemo } from 'react';
import * as d3 from 'd3';

interface CandleData {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  macd?: {
    macdLine: number;
    signalLine: number;
    histogram: number;
  };
}

interface CandlestickChartProps {
  data: CandleData[];
  showMacd?: boolean;
}

export const CandlestickChart: React.FC<CandlestickChartProps> = ({ data, showMacd = true }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  // EMA Helper optimized for performance
  const calculateEMA = (values: number[] | Float64Array, period: number) => {
    const n = values.length;
    const series = new Float64Array(n);
    if (n === 0) return series;
    
    const k = 2 / (period + 1);
    let ema = values[0];
    series[0] = ema;
    
    for (let i = 1; i < n; i++) {
      ema = values[i] * k + ema * (1 - k);
      series[i] = ema;
    }
    return series;
  };

  // Memoize processed data with indicators and efficient aggregation
  const processedData = useMemo(() => {
    const n = data.length;
    if (n === 0) return [];

    // 1. Calculate indicators on full data for accuracy using typed arrays
    const closes = new Float64Array(n);
    for (let i = 0; i < n; i++) closes[i] = data[i].close;

    const ema12 = calculateEMA(closes, 12);
    const ema26 = calculateEMA(closes, 26);
    
    const macdLines = new Float64Array(n);
    for (let i = 0; i < n; i++) {
      macdLines[i] = ema12[i] - ema26[i];
    }
    
    const signalLines = calculateEMA(macdLines, 9);
    
    // 2. Downsample using OHLC aggregation if data is too large
    const maxPoints = 300;
    if (n <= maxPoints) {
      return data.map((d, i) => ({
        ...d,
        macd: {
          macdLine: macdLines[i],
          signalLine: signalLines[i],
          histogram: macdLines[i] - signalLines[i]
        }
      }));
    }

    const factor = Math.ceil(n / maxPoints);
    const aggregated: CandleData[] = [];
    
    for (let i = 0; i < n; i += factor) {
      const end = Math.min(i + factor, n);
      let high = -Infinity;
      let low = Infinity;
      let macdSum = 0;
      let signalSum = 0;
      let histSum = 0;
      
      for (let j = i; j < end; j++) {
        const d = data[j];
        if (d.high > high) high = d.high;
        if (d.low < low) low = d.low;
        
        const mLine = macdLines[j];
        const sLine = signalLines[j];
        macdSum += mLine;
        signalSum += sLine;
        histSum += (mLine - sLine);
      }
      
      const count = end - i;
      aggregated.push({
        time: data[i].time,
        open: data[i].open,
        close: data[end - 1].close,
        high,
        low,
        macd: {
          macdLine: macdSum / count,
          signalLine: signalSum / count,
          histogram: histSum / count
        }
      });
    }
    
    return aggregated;
  }, [data]);

  useEffect(() => {
    if (!containerRef.current || !svgRef.current) return;

    const render = () => {
      const container = containerRef.current;
      const svgElement = svgRef.current;
      if (!container || !svgElement || processedData.length === 0) {
        d3.select(svgElement).selectAll('*').remove();
        return;
      }

      const { width, height } = container.getBoundingClientRect();
      if (width === 0 || height === 0) return;

      const svg = d3.select(svgElement);
      svg.selectAll('*').remove();

      // Layout configuration
      const macdHeight = showMacd ? height * 0.25 : 0;
      const mainHeight = height - macdHeight - 50; // 50 for margins/axes
      const margin = { top: 20, right: 50, bottom: 30, left: 10 };
      
      const chartWidth = width - margin.left - margin.right;
      const chartHeight = mainHeight;

      if (chartWidth <= 0 || chartHeight <= 0) return;

      const x = d3.scaleBand()
        .domain(processedData.map(d => d.time.toString()))
        .range([0, chartWidth])
        .padding(processedData.length > 100 ? 0.1 : 0.3);

      const y = d3.scaleLinear()
        .domain([
          d3.min(processedData, (d: CandleData) => d.low) || 0,
          d3.max(processedData, (d: CandleData) => d.high) || 0
        ])
        .nice()
        .range([chartHeight, 0]);

      const g = svg.append('g')
        .attr('transform', `translate(${margin.left},${margin.top})`);

      // Grid lines (Horizontal)
      g.append('g')
        .attr('class', 'grid')
        .attr('stroke', 'rgba(255, 255, 255, 0.05)')
        .attr('stroke-dasharray', '2,2')
        .call(d3.axisLeft(y)
          .ticks(5)
          .tickSize(-chartWidth)
          .tickFormat(() => '')
        )
        .call(g => g.select('.domain').remove());

      // X Axis
      const tickCount = Math.min(processedData.length, Math.floor(chartWidth / 80));
      const xAxis = d3.axisBottom(x)
        .tickValues(x.domain().filter((d, i) => {
          const step = Math.ceil(processedData.length / tickCount);
          return i % step === 0;
        }))
        .tickFormat(d => {
          const date = new Date(parseInt(d));
          return `${date.getHours()}:${date.getMinutes().toString().padStart(2, '0')}`;
        });

      const xAxisG = g.append('g')
        .attr('transform', `translate(0,${chartHeight + (showMacd ? macdHeight + 10 : 0)})`)
        .attr('color', 'rgba(255, 255, 255, 0.3)')
        .call(xAxis);
      
      xAxisG.call(g => g.select('.domain').attr('stroke', 'rgba(255,255,255,0.1)'))
        .selectAll('text')
        .style('font-size', '10px')
        .style('font-family', 'monospace');

      // Y Axis
      g.append('g')
        .attr('transform', `translate(${chartWidth}, 0)`)
        .attr('color', 'rgba(255, 255, 255, 0.3)')
        .call(d3.axisRight(y).ticks(5).tickFormat(d3.format('.2f')))
        .call(g => g.select('.domain').remove())
        .selectAll('text')
        .style('font-size', '10px')
        .style('font-family', 'monospace');

      // Candlesticks
      const candleGroup = g.selectAll('.candle')
        .data(processedData)
        .enter()
        .append('g')
        .attr('class', 'candle');

      const barWidth = x.bandwidth();
      const halfBarWidth = barWidth / 2;

      // Wicks
      candleGroup.append('line')
        .attr('x1', (d: CandleData) => (x(d.time.toString()) || 0) + halfBarWidth)
        .attr('x2', (d: CandleData) => (x(d.time.toString()) || 0) + halfBarWidth)
        .attr('y1', (d: CandleData) => y(d.high))
        .attr('y2', (d: CandleData) => y(d.low))
        .attr('stroke', (d: CandleData) => d.close >= d.open ? '#10b981' : '#ef4444')
        .attr('stroke-width', Math.max(1, barWidth * 0.1));

      // Bodies
      candleGroup.append('rect')
        .attr('x', (d: CandleData) => x(d.time.toString()) || 0)
        .attr('y', (d: CandleData) => y(Math.max(d.open, d.close)))
        .attr('width', barWidth)
        .attr('height', (d: CandleData) => Math.max(1, Math.abs(y(d.open) - y(d.close))))
        .attr('fill', (d: CandleData) => d.close >= d.open ? '#10b981' : '#ef4444')
        .attr('rx', Math.min(2, barWidth * 0.2));

      // MACD Pane
      if (showMacd) {
        const macdG = g.append('g')
          .attr('transform', `translate(0, ${chartHeight + 20})`);

        const macdY = d3.scaleLinear()
          .domain([
            d3.min(processedData, (d: CandleData) => Math.min(d.macd?.macdLine || 0, d.macd?.signalLine || 0, d.macd?.histogram || 0)) || 0,
            d3.max(processedData, (d: CandleData) => Math.max(d.macd?.macdLine || 0, d.macd?.signalLine || 0, d.macd?.histogram || 0)) || 0
          ])
          .nice()
          .range([macdHeight, 0]);

        // MACD Y Axis
        macdG.append('g')
          .attr('transform', `translate(${chartWidth}, 0)`)
          .attr('color', 'rgba(255, 255, 255, 0.2)')
          .call(d3.axisRight(macdY).ticks(3).tickFormat(d3.format('.2f')))
          .call(g => g.select('.domain').remove())
          .selectAll('text')
          .style('font-size', '8px');

        // Histogram
        macdG.selectAll('.hist')
          .data(processedData)
          .enter()
          .append('rect')
          .attr('x', (d: CandleData) => x(d.time.toString()) || 0)
          .attr('y', (d: CandleData) => d.macd!.histogram >= 0 ? macdY(d.macd!.histogram) : macdY(0))
          .attr('width', barWidth)
          .attr('height', (d: CandleData) => Math.abs(macdY(d.macd!.histogram) - macdY(0)))
          .attr('fill', (d: CandleData) => d.macd!.histogram >= 0 ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)');

        // MACD Line
        const macdLineGen = d3.line<CandleData>()
          .x((d: CandleData) => (x(d.time.toString()) || 0) + halfBarWidth)
          .y((d: CandleData) => macdY(d.macd!.macdLine));

        macdG.append('path')
          .datum(processedData)
          .attr('fill', 'none')
          .attr('stroke', '#38bdf8') // Sky 400
          .attr('stroke-width', 1.5)
          .attr('d', macdLineGen);

        // Signal Line
        const signalLineGen = d3.line<CandleData>()
          .x((d: CandleData) => (x(d.time.toString()) || 0) + halfBarWidth)
          .y((d: CandleData) => macdY(d.macd!.signalLine));

        macdG.append('path')
          .datum(processedData)
          .attr('fill', 'none')
          .attr('stroke', '#fbbf24') // Amber 400 (Visually distinct)
          .attr('stroke-width', 1.5)
          .attr('stroke-dasharray', '2,1')
          .attr('d', signalLineGen);
          
        // MACD Zero Line
        macdG.append('line')
          .attr('x1', 0)
          .attr('x2', chartWidth)
          .attr('y1', macdY(0))
          .attr('y2', macdY(0))
          .attr('stroke', 'rgba(255, 255, 255, 0.1)')
          .attr('stroke-width', 1);
      }
    };

    // Initial render
    render();

    // Responsive handling
    const resizeObserver = new ResizeObserver(() => {
      window.requestAnimationFrame(render);
    });

    resizeObserver.observe(containerRef.current);

    return () => {
      resizeObserver.disconnect();
    };
  }, [processedData]);

  return (
    <div ref={containerRef} className="w-full h-full min-h-[200px] relative overflow-hidden">
      {data.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center text-white/20 text-xs font-mono">
          NO DATA AVAILABLE
        </div>
      )}
      <svg
        ref={svgRef}
        className="w-full h-full overflow-visible"
        style={{ shapeRendering: 'crispEdges' }}
      />
    </div>
  );
};

