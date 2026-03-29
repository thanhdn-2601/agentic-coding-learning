import Image from 'next/image';
import { getTranslations } from 'next-intl/server';
import type { Award, AwardUnit } from '@/lib/awards-data';

const SaaIcon = () => (
  <svg
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className="text-white"
    aria-hidden="true"
  >
    <path
      d="M12 0C10.42414 0 8.86371 0.310389 7.40781 0.913446C5.95191 1.5165 4.62903 2.40042 3.51472 3.51472C1.26429 5.76515 0 8.80541 0 12C0 15.1946 1.26429 18.2349 3.51472 20.4853C4.62903 21.5996 5.95191 22.4835 7.40781 23.0866C8.86371 23.6896 10.42414 24 12 24C15.1946 24 18.2349 22.7357 20.4853 20.4853C22.7357 18.2349 24 15.1946 24 12C24 10.608 23.748 9.228 23.268 7.932L21.348 9.852C21.516 10.56 21.6 11.28 21.6 12C21.6 14.546 20.5886 16.9879 18.7883 18.7883C16.9879 20.5886 14.546 21.6 12 21.6C9.45392 21.6 7.01213 20.5886 5.21178 18.7883C3.41143 16.9879 2.4 14.546 2.4 12C2.4 9.45392 3.41143 7.01213 5.21178 5.21178C7.01213 3.41143 9.45392 2.4 12 2.4C12.72 2.4 13.44 2.484 14.148 2.652L16.08 0.72C14.772 0.252 13.392 0 12 0ZM20.4 0L15.6 4.8V6.6L12.54 9.66C12.36 9.6 12.18 9.6 12 9.6C11.3635 9.6 10.753 9.85285 10.3029 10.3029C9.85285 10.753 9.6 11.3635 9.6 12C9.6 12.6365 9.85285 13.247 10.3029 13.697C10.753 14.1471 11.3635 14.4 12 14.4C12.6365 14.4 13.247 14.1471 13.697 13.697C14.1471 13.247 14.4 12.6365 14.4 12C14.4 11.82 14.4 11.64 14.34 11.46L17.4 8.4H19.2L24 3.6H20.4V0ZM12 4.8C10.0904 4.8 8.25909 5.55857 6.90883 6.90883C5.55857 8.25909 4.8 10.0904 4.8 12C4.8 13.9096 5.55857 15.7409 6.90883 17.0911C8.25909 18.4414 10.0904 19.2 12 19.2C13.9096 19.2 15.7409 18.4414 17.0911 17.0911C18.4414 15.7409 19.2 13.9096 19.2 12H16.8C16.8 13.2731 16.2943 14.4939 15.3941 15.3941C14.4939 16.2943 13.2731 16.8 12 16.8C10.7269 16.8 9.50606 16.2943 8.60589 15.3941C7.70571 14.4939 7.2 13.2731 7.2 12C7.2 10.7269 7.70571 9.50606 8.60589 8.60589C9.50606 7.70571 10.7269 7.2 12 7.2V4.8Z"
      fill="currentColor"
    />
  </svg>
);

interface AwardBlockProps {
  award: Award;
  index: number;
}

const UNIT_KEY: Record<AwardUnit, string> = {
  'Cá nhân': 'unitIndividual',
  'Tập thể': 'unitTeam',
  'Cá nhân hoặc tập thể': 'unitIndividualOrTeam',
};

export default async function AwardBlock({ award, index }: AwardBlockProps) {
  const t = await getTranslations('awards.block');
  // Alternate image position: even index → left (flex-row), odd → right (flex-row-reverse)
  const imageOnLeft = index % 2 === 0;

  return (
    <div id={award.slug} className="scroll-mt-20">
      <div className="flex flex-col pb-20 border-b border-b-(--Details-Divider)">
        <div
          className={`flex gap-10 flex-col mx-auto xl:mx-[unset] ${imageOnLeft ? 'lg:flex-row' : 'lg:flex-row-reverse'}`}
        >
          {/* Award image */}
          <div className="relative flex items-center justify-center rounded-3xl border-[0.955px] overflow-hidden shadow-[0_0_6px_0_#FAE287] border-(--Details-Text-Primary-1) mix-blend-screen shrink-0 mx-auto lg:mx-[unset] w-50 h-50 sm:w-60 sm:h-60 lg:w-84 lg:h-84">
            <Image
              src="/assets/award-background.png"
              alt=""
              fill
              className="object-cover"
              aria-hidden="true"
            />
            <div className="absolute inset-0 flex items-center justify-center z-10 p-13.25">
              <Image
                src={`/assets/award-name-${award.nameImage}.png`}
                alt={award.name}
                width={230}
                height={53}
                className="drop-shadow-[0_0_6px_rgba(250,226,135,0.5)]"
                style={{ objectFit: 'contain' }}
              />
            </div>
          </div>

          {/* Content */}
          <div className="flex flex-col gap-6 md:gap-8 w-full rounded-2xl backdrop-blur-[2rem]">
            {/* Title + description */}
            <div className="flex flex-col gap-6">
              <div className="flex items-center justify-center lg:justify-start gap-4">
                <SaaIcon />
                <h2 className="font-normal text-2xl leading-8 tracking-[0px] text-(--Details-Text-Primary-1)">
                  {award.name}
                </h2>
              </div>
              {award.descriptions.map((desc, i) => (
                <p
                  key={i}
                  className="font-normal text-justify text-base leading-6 md:leading-7 tracking-[0.5px] text-(--Details-Text-Secondary-1)"
                >
                  {desc}
                </p>
              ))}
            </div>

            <div className="h-px w-full bg-(--Details-Divider)" />

            {/* Quantity */}
            <div className="flex items-center gap-4">
              <Image
                src="/assets/awards/icons/Diamond.svg"
                alt="Diamond"
                width={24}
                height={24}
                style={{ objectFit: 'contain' }}
              />
              <p className="font-normal text-2xl leading-8 text-(--Details-Text-Primary-1)">
                {t('quantityLabel')}
              </p>
              <p className="font-normal text-4xl leading-11 text-(--Details-Text-Secondary-1)">
                {String(award.quantity).padStart(2, '0')}
              </p>
              <p className="text-sm leading-5 font-medium text-(--Details-Text-Secondary-1)">
                {t(UNIT_KEY[award.unit])}
              </p>
            </div>

            <div className="h-px w-full bg-(--Details-Divider)" />

            {/* Value */}
            <div className="flex flex-col gap-6">
              <div className="flex items-center gap-4">
                <Image
                  src="/assets/awards/icons/Award.svg"
                  alt="Award"
                  width={24}
                  height={24}
                  style={{ objectFit: 'contain' }}
                />
                <p className="font-normal text-2xl leading-8 text-(--Details-Text-Primary-1)">
                  {t('valueLabel')}
                </p>
              </div>

              <div className="flex flex-col gap-4">
                {award.value.single && (
                  <div className="flex items-baseline gap-2">
                    <p className="font-normal text-4xl leading-11 text-(--Details-Text-Secondary-1)">
                      {award.value.single}
                    </p>
                    {award.quantity > 1 && (
                      <p className="text-sm leading-5 font-medium text-(--Details-Text-Secondary-1)">
                        {t('perAward')}
                      </p>
                    )}
                  </div>
                )}

                {(award.value.individual || award.value.team) && (
                  <>
                    {award.value.individual && (
                      <div className="flex items-baseline gap-2">
                        <p className="font-normal text-4xl leading-11 text-(--Details-Text-Secondary-1)">
                          {award.value.individual}
                        </p>
                        <p className="text-sm leading-5 font-medium text-(--Details-Text-Secondary-1)">
                          {t('forIndividual')}
                        </p>
                      </div>
                    )}
                    {award.value.individual && award.value.team && (
                      <div className="flex items-center justify-center gap-2">
                        <p className="text-sm leading-5 font-medium text-(--Details-Divider)">{t('or')}</p>
                        <div className="h-px flex-1 bg-(--Details-Divider)" />
                      </div>
                    )}
                    {award.value.team && (
                      <div className="flex items-baseline gap-2">
                        <p className="font-normal text-4xl leading-11 text-(--Details-Text-Secondary-1)">
                          {award.value.team}
                        </p>
                        <p className="text-sm leading-5 font-medium text-(--Details-Text-Secondary-1)">
                          {t('forTeam')}
                        </p>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

