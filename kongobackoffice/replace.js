const fs = require('fs');

const targetFile = 'src/components/SearchResults.tsx';
const lines = fs.readFileSync(targetFile, 'utf8').split('\n');

const startIndex = 793; // 794. 0-indexed is 793
const endIndex = 934;   // 935. 0-indexed is 934

const newComponent = `                  <Card className="hover:shadow-lg transition-all duration-300 border border-gray-200 overflow-hidden bg-white mb-6">
                    <CardContent className="p-6">
                      <div className="flex flex-col md:flex-row gap-6">
                        
                        {/* Section 1: Left details - 8 columns equivalent */}
                        <div className="flex-1 min-w-0">
                          
                          {/* Header of card */}
                          <div className="flex items-center space-x-2 mb-2">
                            <h3 className="font-bold text-xl text-kongo-black">{trip.company}</h3>
                            {trip.vehicleType === 'train' ? <Train className="w-5 h-5 text-gray-500" /> : <Bus className="w-5 h-5 text-gray-500" />}
                          </div>
                          
                          <div className="flex items-center space-x-2 mb-6">
                            <Badge className="bg-kongo-lime text-kongo-black font-bold text-[11px] hover:bg-kongo-lime rounded-sm">{trip.busType}</Badge>
                            {trip.isPopular && <Badge className="bg-[#fdf3e7] text-[#d97706] font-semibold text-[11px] border-none hover:bg-[#fdf3e7] rounded-sm">Populaire</Badge>}
                          </div>

                          {/* Timeline / Route */}
                          <div className="flex items-start md:items-center space-x-0 md:space-x-4 mb-4 flex-col md:flex-row gap-4 md:gap-0">
                            <div className="text-left w-24">
                              <div className="text-[28px] leading-none font-bold text-kongo-black mb-1">{trip.departure}</div>
                              <div className="text-sm text-gray-500 font-medium">{trip.from}</div>
                            </div>
                            
                            <div className="flex-1 flex flex-col items-center justify-center relative min-w-[120px] max-w-[200px]">
                              <div className="flex flex-col items-center relative w-full pt-4">
                                <div className="flex items-center absolute top-0 bg-white px-2 z-10">
                                  <Clock className="w-3.5 h-3.5 mr-1 text-gray-400" />
                                  <span className="text-[11px] font-medium text-gray-400">{trip.duration}</span>
                                </div>
                                <div className="w-full flex items-center">
                                  <div className="h-[2px] bg-gray-200 flex-1"></div>
                                  <div className="h-[2px] bg-gray-200 flex-1"></div>
                                </div>
                              </div>
                            </div>

                            <div className="text-left w-24">
                              <div className="text-[28px] leading-none font-bold text-kongo-black mb-1">{trip.arrival}</div>
                              <div className="text-sm text-gray-500 font-medium">{trip.to}</div>
                            </div>
                          </div>

                          {/* Stops line */}
                          {(trip.stops && trip.stops.length > 0) ? (
                            <div className="text-sm text-gray-500 mb-6 font-medium">
                              Arrêts: {trip.stops.join(', ')}
                            </div>
                          ) : (
                            <div className="text-sm text-gray-500 mb-6 font-medium">Trajet direct</div>
                          )}

                          {/* Detailed multi-step section */}
                          <div className="mb-6 pl-0">
                            <div className="flex items-center space-x-2 mb-2">
                              <MapPin className="w-4 h-4 text-[#2e5b99]" />
                              <span className="text-sm font-semibold text-[#2e5b99]">Trajet multi-étapes vers la côte</span>
                            </div>
                            
                            <div className="text-xs text-[#2e5b99]/90 space-y-1.5 mb-2 pl-6">
                              <div className="flex justify-between max-w-sm">
                                <span>{trip.from} → Matadi</span>
                                <span className="opacity-80">05:30 - 09:45 (4h15)</span>
                              </div>
                              <div className="flex justify-between max-w-sm">
                                <span>Matadi → Boma</span>
                                <span className="opacity-80">10:30 - 13:15 (2h45)</span>
                              </div>
                              <div className="flex justify-between max-w-sm">
                                <span>Boma → {trip.to}</span>
                                <span className="opacity-80">14:00 - {trip.arrival}</span>
                              </div>
                            </div>
                            
                            <div className="text-[11px] text-[#2e5b99]/80 max-w-lg leading-relaxed pl-6">
                              <span className="font-bold">Points d'intérêt: </span>
                              Vue panoramique, arrêts touristiques, paysages locaux.
                            </div>
                          </div>
                          
                          {/* Amenities text list */}
                          <div className="flex flex-wrap items-center gap-4 text-[13px] text-gray-600 font-medium">
                            {trip.amenitiesLabels?.slice(0, 3).map((f, i) => (
                              <span key={i}>{f}</span>
                            ))}
                            {trip.amenitiesLabels && trip.amenitiesLabels.length > 3 && (
                              <span className="font-bold text-kongo-black">+{trip.amenitiesLabels.length - 3} autres</span>
                            )}
                          </div>
                        </div>

                        {/* Middle section (Rating & Alerts) */}
                        <div className="w-full md:w-64 flex flex-col items-end md:justify-start pt-2 gap-4">
                           <div className="flex items-center space-x-1.5 w-full max-w-[220px]">
                            <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                            <span className="font-bold text-[15px] text-kongo-black">{trip.rating}</span>
                            <span className="text-sm text-gray-500">({trip.reviews})</span>
                          </div>

                          {/* Availability / Alert container */}
                          <div className="w-full max-w-[220px]">
                           <div className={'flex items-center space-x-1.5 font-medium text-[13px] mb-3 ' + (trip.availableSeats > 10 ? 'text-green-600' : trip.availableSeats > 0 ? 'text-yellow-600' : 'text-red-600')}>
                             <div className={'w-2 h-2 rounded-full ' + (trip.availableSeats > 10 ? 'bg-green-600' : trip.availableSeats > 0 ? 'bg-yellow-600' : 'bg-red-600') + ' animate-pulse'} />
                             <span>Live</span>
                             <span>{trip.availableSeats} places restantes</span>
                           </div>
                           
                           <Button variant="outline" className="w-full border-[#d1ecc6] text-[#2c7a10] hover:bg-[#f0f9eb] hover:text-[#1c5c06] px-4 mb-3 rounded-xl justify-center h-10 border shadow-sm font-medium">
                             <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></svg>
                             Alerte prix
                           </Button>

                           <div className="w-full border border-gray-200 rounded-xl p-4 bg-gray-50/50 flex flex-col gap-2 relative shadow-sm">
                             <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400 absolute top-4 left-4"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></svg>
                             <div className="pl-6">
                               <p className="text-[13px] font-medium text-kongo-black leading-tight mb-4">Alerte active pour<br/>{trip.from} → {trip.to}</p>
                               <div className="flex items-end justify-between mt-6">
                                  <p className="text-[10px] text-gray-500 font-bold uppercase leading-tight max-w-[100px]">Vous serez notifié si le prix descend sous {(trip.price * 0.9).toLocaleString()} CDF</p>
                                  <div className="border border-[#75b060] text-[#4d863a] rounded-full px-2 py-0.5 text-[10px] font-extrabold tracking-wider">ACTIF</div>
                               </div>
                             </div>
                           </div>
                          </div>
                        </div>

                        {/* Right section (Price & Action) */}
                        <div className="w-full md:w-56 flex flex-col justify-between pt-2 pl-4">
                          <div className="text-right">
                            <div className="text-[32px] font-black text-kongo-black leading-none mb-2 tracking-tight">
                              {trip.price.toLocaleString()}
                            </div>
                            <div className="text-xs text-gray-500 font-medium">
                              CDF par personne
                            </div>
                          </div>

                          <div className="mt-8 md:mt-auto text-right flex flex-col items-end">
                            <Button
                              onClick={(e) => {
                                e.stopPropagation();
                                if (userRole === 'guest' || !userRole) {
                                  toast.error("Connexion requise", {
                                    description: "Vous devez être connecté pour effectuer une réservation.",
                                  });
                                  return;
                                }
                                onSelectTrip(trip);
                              }}
                              disabled={trip.availableSeats === 0}
                              className={'w-full h-[46px] rounded-xl font-bold text-sm transition-all shadow-sm ' + (trip.availableSeats === 0 ? 'bg-gray-100 text-gray-400' : 'bg-kongo-lime text-kongo-black hover:bg-[#aedf25]')}
                            >
                              {trip.availableSeats === 0 ? 'Complet' : 'Sélectionner'}
                            </Button>
                            <div className="mt-3 text-xs text-gray-500 font-medium w-full text-center">
                              Prix pour {currentSearchParams.passengers} passager{currentSearchParams.passengers > 1 ? 's' : ''}
                            </div>
                          </div>
                        </div>

                      </div>
                    </CardContent>
                  </Card>`;

lines.splice(startIndex, endIndex - startIndex + 1, newComponent);

fs.writeFileSync(targetFile, lines.join('\n'), 'utf8');
console.log('Successfully replaced lines');
