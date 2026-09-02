import { Loader } from '@progress/kendo-react-indicators';

type CommonLoaderProps = {
    message?:string;
};
function CommonLoader(props:CommonLoaderProps) {
  const message=props.message ?? "Loading....";
  return (
    <>
    <div
      style={{
        minHeight: "150px",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        gap: "12px",
      }}
    >
    <Loader
        size="large"
        type="infinite-spinner"
      />

        <span>{message}</span>
        </div>
    
    
    </>
  )
}

export default CommonLoader