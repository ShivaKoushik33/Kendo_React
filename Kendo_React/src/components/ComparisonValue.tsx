type ComparisonValueProps = {
    value: number;
    average: number;
};

function ComparisonValue({ value, average }: ComparisonValueProps) {
    const difference = value - average;

    const percentage =
        average === 0
            ? null
            : (difference / Math.abs(average)) * 100;

    const isAboveAverage = difference > 0;
    const isBelowAverage = difference < 0;

    const color = isAboveAverage
        ? "#16803c"
        : isBelowAverage
            ? "#d93025"
            : "#6b7280";

    const arrow = isAboveAverage
        ? "▲"
        : isBelowAverage
            ? "▼"
            : "—";

    const status = isAboveAverage
        ? ""
        : isBelowAverage
            ? ""
            : "Average";

    return (
        <span style={{ color }}>
            <strong>{value}</strong>{" "}
            <span>
                {arrow}{" "}
                {percentage === null
                    ? "—"
                    : `${Math.abs(percentage).toFixed(0)}%`}
            </span>{" "}
            <small>{status}</small>
        </span>
    );
}

export default ComparisonValue;