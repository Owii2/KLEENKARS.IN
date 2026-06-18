interface Props {

  title: string;

  subtitle?: string;

}

export default function SectionTitle({

  title,

  subtitle,

}: Props) {

  return (

    <div className="text-center mb-14">

      <h2 className="text-4xl sm:text-5xl font-black mb-5">

        {title}

      </h2>

      {subtitle && (

        <p className="text-gray-400 max-w-2xl mx-auto">

          {subtitle}

        </p>

      )}

    </div>

  );

}