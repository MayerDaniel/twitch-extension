import { classes } from "../utils/classes";

interface CardProps {
  children?: React.ReactNode;
  title?: string;
  className?: string;
}

export default function Card(props: CardProps) {
  const { children, title, className } = props;

  return (
    <div
      className={classes(
        "scrollbar-thin flex min-h-[100px] h-auto w-[32rem] min-w-[400px] max-w-full flex-col items-center justify-between overflow-y-auto rounded-3xl bg-black p-5 shadow-sm scrollbar-thumb-gray scrollbar-track-gray-900",
        className,
      )}
    >
      {title && (
        <h2 className="mb-2 text-center font-serif text-3xl font-bold">
          {title}
        </h2>
      )}
      <div className="w-full h-full flex flex-col items-center justify-center">
        {children}
      </div>
    </div>
  );
}
