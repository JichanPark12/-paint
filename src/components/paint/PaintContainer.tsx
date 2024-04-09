import dynamic from 'next/dynamic';

const Paint = dynamic(() => import('./Paint'), { ssr: false });

const PaintContainer = () => {
  return (
    <div className=" max-w-screen-md mx-auto text-red-400">
      <Paint />
    </div>
  );
};

export default PaintContainer;
