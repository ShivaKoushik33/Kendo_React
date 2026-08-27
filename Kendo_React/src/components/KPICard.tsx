import {
  Card,
  CardBody,
  CardTitle,
} from "@progress/kendo-react-layout";

type KPICardProps = {
  title: string;
  value: number;
  suffix?: string;
};

function KPICard({
  title,
  value,
  suffix = "",
}: KPICardProps) {
  return (
    <Card style={{ width: "250px" }}>
      <CardBody>
        <CardTitle>{title}</CardTitle>
        <h2>
          {value}
          {suffix}
        </h2>
      </CardBody>
    </Card>
  );
}

export default KPICard;