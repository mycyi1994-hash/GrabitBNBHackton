export function MetricBars({ values }: { values: number[] }) {
  return (
    <div className="mini-chart" aria-label="Recent performance trend">
      {values.map((height, index) => (
        <span key={index} style={{ height: height + '%' }} />
      ))}
    </div>
  );
}

