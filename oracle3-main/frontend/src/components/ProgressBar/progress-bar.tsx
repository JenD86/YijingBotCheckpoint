const ProgressBar = ({
  bgColor = "#32363C",
  value,
}: { bgColor?: string; value: number }) => {
  return (
    <div className={`w-full h-2 bg-[${bgColor}] rounded-full`}>
      <div
        className='h-full rounded-full bg-gradient-to-r from-[#FAE163] to-[#B97806]'
        style={{ width: value + "%" }}
      />
    </div>
  );
};

export default ProgressBar;
