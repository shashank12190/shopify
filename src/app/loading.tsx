import Image from "next/image";
import loader from "@/assets/loader.gif";

const LoadingPage = () => {
  return (
    <div className="flex h-screen w-full items-center justify-center">
      <Image src={loader} alt="Loading..." width={150} height={150} />
    </div>
  );
};

export default LoadingPage;
