'use strict';

customElements.define('compodoc-menu', class extends HTMLElement {
    constructor() {
        super();
        this.isNormalMode = this.getAttribute('mode') === 'normal';
    }

    connectedCallback() {
        this.render(this.isNormalMode);
    }

    render(isNormalMode) {
        let tp = lithtml.html(`
        <nav>
            <ul class="list">
                <li class="title">
                    <a href="index.html" data-type="index-link">the-international-screeps-bot documentation</a>
                </li>

                <li class="divider"></li>
                ${ isNormalMode ? `<div id="book-search-input" role="search"><input type="text" placeholder="Type to search"></div>` : '' }
                <li class="chapter">
                    <a data-type="chapter-link" href="index.html"><span class="icon ion-ios-home"></span>Getting started</a>
                    <ul class="links">
                        <li class="link">
                            <a href="overview.html" data-type="chapter-link">
                                <span class="icon ion-ios-keypad"></span>Overview
                            </a>
                        </li>
                        <li class="link">
                            <a href="index.html" data-type="chapter-link">
                                <span class="icon ion-ios-paper"></span>README
                            </a>
                        </li>
                        <li class="link">
                            <a href="license.html"  data-type="chapter-link">
                                <span class="icon ion-ios-paper"></span>LICENSE
                            </a>
                        </li>
                                <li class="link">
                                    <a href="dependencies.html" data-type="chapter-link">
                                        <span class="icon ion-ios-list"></span>Dependencies
                                    </a>
                                </li>
                                <li class="link">
                                    <a href="properties.html" data-type="chapter-link">
                                        <span class="icon ion-ios-apps"></span>Properties
                                    </a>
                                </li>
                    </ul>
                </li>
                    <li class="chapter">
                        <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ? 'data-bs-target="#classes-links"' :
                            'data-bs-target="#xs-classes-links"' }>
                            <span class="icon ion-ios-paper"></span>
                            <span>Classes</span>
                            <span class="icon ion-ios-arrow-down"></span>
                        </div>
                        <ul class="links collapse " ${ isNormalMode ? 'id="classes-links"' : 'id="xs-classes-links"' }>
                            <li class="link">
                                <a href="classes/AllyRequestManager.html" data-type="entity-link" >AllyRequestManager</a>
                            </li>
                            <li class="link">
                                <a href="classes/AllyVanguard.html" data-type="entity-link" >AllyVanguard</a>
                            </li>
                            <li class="link">
                                <a href="classes/Antifa.html" data-type="entity-link" >Antifa</a>
                            </li>
                            <li class="link">
                                <a href="classes/BasePlans.html" data-type="entity-link" >BasePlans</a>
                            </li>
                            <li class="link">
                                <a href="classes/Builder.html" data-type="entity-link" >Builder</a>
                            </li>
                            <li class="link">
                                <a href="classes/BuilderManager.html" data-type="entity-link" >BuilderManager</a>
                            </li>
                            <li class="link">
                                <a href="classes/Claimer.html" data-type="entity-link" >Claimer</a>
                            </li>
                            <li class="link">
                                <a href="classes/CollectiveManager.html" data-type="entity-link" >CollectiveManager</a>
                            </li>
                            <li class="link">
                                <a href="classes/Collectivizer.html" data-type="entity-link" >Collectivizer</a>
                            </li>
                            <li class="link">
                                <a href="classes/CombatRequestManager.html" data-type="entity-link" >CombatRequestManager</a>
                            </li>
                            <li class="link">
                                <a href="classes/CommuneManager.html" data-type="entity-link" >CommuneManager</a>
                            </li>
                            <li class="link">
                                <a href="classes/CommunePlanner.html" data-type="entity-link" >CommunePlanner</a>
                            </li>
                            <li class="link">
                                <a href="classes/ConstructionManager.html" data-type="entity-link" >ConstructionManager</a>
                            </li>
                            <li class="link">
                                <a href="classes/ConstructionSiteManager.html" data-type="entity-link" >ConstructionSiteManager</a>
                            </li>
                            <li class="link">
                                <a href="classes/ContainerManager.html" data-type="entity-link" >ContainerManager</a>
                            </li>
                            <li class="link">
                                <a href="classes/ControllerUpgrader.html" data-type="entity-link" >ControllerUpgrader</a>
                            </li>
                            <li class="link">
                                <a href="classes/ControllerUpgraderManager.html" data-type="entity-link" >ControllerUpgraderManager</a>
                            </li>
                            <li class="link">
                                <a href="classes/CreepOrganizer.html" data-type="entity-link" >CreepOrganizer</a>
                            </li>
                            <li class="link">
                                <a href="classes/CreepRoleManager.html" data-type="entity-link" >CreepRoleManager</a>
                            </li>
                            <li class="link">
                                <a href="classes/DefenceManager.html" data-type="entity-link" >DefenceManager</a>
                            </li>
                            <li class="link">
                                <a href="classes/DroppedResourceManager.html" data-type="entity-link" >DroppedResourceManager</a>
                            </li>
                            <li class="link">
                                <a href="classes/Duo.html" data-type="entity-link" >Duo</a>
                            </li>
                            <li class="link">
                                <a href="classes/DynamicSquad.html" data-type="entity-link" >DynamicSquad</a>
                            </li>
                            <li class="link">
                                <a href="classes/EndTickCreepManager.html" data-type="entity-link" >EndTickCreepManager</a>
                            </li>
                            <li class="link">
                                <a href="classes/EndTickManager.html" data-type="entity-link" >EndTickManager</a>
                            </li>
                            <li class="link">
                                <a href="classes/ErrorExporter.html" data-type="entity-link" >ErrorExporter</a>
                            </li>
                            <li class="link">
                                <a href="classes/ErrorMapper.html" data-type="entity-link" >ErrorMapper</a>
                            </li>
                            <li class="link">
                                <a href="classes/FactoryManager.html" data-type="entity-link" >FactoryManager</a>
                            </li>
                            <li class="link">
                                <a href="classes/FastFiller.html" data-type="entity-link" >FastFiller</a>
                            </li>
                            <li class="link">
                                <a href="classes/FeatureFlagManager.html" data-type="entity-link" >FeatureFlagManager</a>
                            </li>
                            <li class="link">
                                <a href="classes/FlagManager.html" data-type="entity-link" >FlagManager</a>
                            </li>
                            <li class="link">
                                <a href="classes/Hauler.html" data-type="entity-link" >Hauler</a>
                            </li>
                            <li class="link">
                                <a href="classes/HaulerManager.html" data-type="entity-link" >HaulerManager</a>
                            </li>
                            <li class="link">
                                <a href="classes/HaulerNeedManager.html" data-type="entity-link" >HaulerNeedManager</a>
                            </li>
                            <li class="link">
                                <a href="classes/HaulerSizeManager.html" data-type="entity-link" >HaulerSizeManager</a>
                            </li>
                            <li class="link">
                                <a href="classes/HaulRequestManager.html" data-type="entity-link" >HaulRequestManager</a>
                            </li>
                            <li class="link">
                                <a href="classes/HubHauler.html" data-type="entity-link" >HubHauler</a>
                            </li>
                            <li class="link">
                                <a href="classes/InitManager.html" data-type="entity-link" >InitManager</a>
                            </li>
                            <li class="link">
                                <a href="classes/Int32Queue.html" data-type="entity-link" >Int32Queue</a>
                            </li>
                            <li class="link">
                                <a href="classes/InterShardPlanner.html" data-type="entity-link" >InterShardPlanner</a>
                            </li>
                            <li class="link">
                                <a href="classes/LabManager.html" data-type="entity-link" >LabManager</a>
                            </li>
                            <li class="link">
                                <a href="classes/LinkManager.html" data-type="entity-link" >LinkManager</a>
                            </li>
                            <li class="link">
                                <a href="classes/Maintainer.html" data-type="entity-link" >Maintainer</a>
                            </li>
                            <li class="link">
                                <a href="classes/MapVisualsManager.html" data-type="entity-link" >MapVisualsManager</a>
                            </li>
                            <li class="link">
                                <a href="classes/MeleeDefender.html" data-type="entity-link" >MeleeDefender</a>
                            </li>
                            <li class="link">
                                <a href="classes/MemHack.html" data-type="entity-link" >MemHack</a>
                            </li>
                            <li class="link">
                                <a href="classes/MigrationManager.html" data-type="entity-link" >MigrationManager</a>
                            </li>
                            <li class="link">
                                <a href="classes/MineralHarvester.html" data-type="entity-link" >MineralHarvester</a>
                            </li>
                            <li class="link">
                                <a href="classes/NukerManager.html" data-type="entity-link" >NukerManager</a>
                            </li>
                            <li class="link">
                                <a href="classes/ObserverManager.html" data-type="entity-link" >ObserverManager</a>
                            </li>
                            <li class="link">
                                <a href="classes/Operator.html" data-type="entity-link" >Operator</a>
                            </li>
                            <li class="link">
                                <a href="classes/PlayerManager.html" data-type="entity-link" >PlayerManager</a>
                            </li>
                            <li class="link">
                                <a href="classes/PowerCreepOrganizer.html" data-type="entity-link" >PowerCreepOrganizer</a>
                            </li>
                            <li class="link">
                                <a href="classes/PowerCreepRoleManager.html" data-type="entity-link" >PowerCreepRoleManager</a>
                            </li>
                            <li class="link">
                                <a href="classes/PowerSpawnsManager.html" data-type="entity-link" >PowerSpawnsManager</a>
                            </li>
                            <li class="link">
                                <a href="classes/Quad.html" data-type="entity-link" >Quad</a>
                            </li>
                            <li class="link">
                                <a href="classes/RampartPlans.html" data-type="entity-link" >RampartPlans</a>
                            </li>
                            <li class="link">
                                <a href="classes/RangedDefender.html" data-type="entity-link" >RangedDefender</a>
                            </li>
                            <li class="link">
                                <a href="classes/RemoteBuilder.html" data-type="entity-link" >RemoteBuilder</a>
                            </li>
                            <li class="link">
                                <a href="classes/RemoteCoreAttacker.html" data-type="entity-link" >RemoteCoreAttacker</a>
                            </li>
                            <li class="link">
                                <a href="classes/RemoteDefender.html" data-type="entity-link" >RemoteDefender</a>
                            </li>
                            <li class="link">
                                <a href="classes/RemoteDismantler.html" data-type="entity-link" >RemoteDismantler</a>
                            </li>
                            <li class="link">
                                <a href="classes/RemoteHarvester.html" data-type="entity-link" >RemoteHarvester</a>
                            </li>
                            <li class="link">
                                <a href="classes/RemoteHauler.html" data-type="entity-link" >RemoteHauler</a>
                            </li>
                            <li class="link">
                                <a href="classes/RemotePlanner.html" data-type="entity-link" >RemotePlanner</a>
                            </li>
                            <li class="link">
                                <a href="classes/RemoteReserver.html" data-type="entity-link" >RemoteReserver</a>
                            </li>
                            <li class="link">
                                <a href="classes/RemotesManager.html" data-type="entity-link" >RemotesManager</a>
                            </li>
                            <li class="link">
                                <a href="classes/RequestHauler.html" data-type="entity-link" >RequestHauler</a>
                            </li>
                            <li class="link">
                                <a href="classes/RespawnManager.html" data-type="entity-link" >RespawnManager</a>
                            </li>
                            <li class="link">
                                <a href="classes/RoomManager.html" data-type="entity-link" >RoomManager</a>
                            </li>
                            <li class="link">
                                <a href="classes/RoomPruningManager.html" data-type="entity-link" >RoomPruningManager</a>
                            </li>
                            <li class="link">
                                <a href="classes/RoomsManager.html" data-type="entity-link" >RoomsManager</a>
                            </li>
                            <li class="link">
                                <a href="classes/RoomVisualsManager.html" data-type="entity-link" >RoomVisualsManager</a>
                            </li>
                            <li class="link">
                                <a href="classes/RuinManager.html" data-type="entity-link" >RuinManager</a>
                            </li>
                            <li class="link">
                                <a href="classes/Scout.html" data-type="entity-link" >Scout</a>
                            </li>
                            <li class="link">
                                <a href="classes/SourceHarvester.html" data-type="entity-link" >SourceHarvester</a>
                            </li>
                            <li class="link">
                                <a href="classes/SourceManager.html" data-type="entity-link" >SourceManager</a>
                            </li>
                            <li class="link">
                                <a href="classes/SpawningStructuresManager.html" data-type="entity-link" >SpawningStructuresManager</a>
                            </li>
                            <li class="link">
                                <a href="classes/SpawnRequestsManager.html" data-type="entity-link" >SpawnRequestsManager</a>
                            </li>
                            <li class="link">
                                <a href="classes/StatsManager.html" data-type="entity-link" >StatsManager</a>
                            </li>
                            <li class="link">
                                <a href="classes/StoringStructuresManager.html" data-type="entity-link" >StoringStructuresManager</a>
                            </li>
                            <li class="link">
                                <a href="classes/TerminalManager.html" data-type="entity-link" >TerminalManager</a>
                            </li>
                            <li class="link">
                                <a href="classes/TickInit.html" data-type="entity-link" >TickInit</a>
                            </li>
                            <li class="link">
                                <a href="classes/TombstoneManager.html" data-type="entity-link" >TombstoneManager</a>
                            </li>
                            <li class="link">
                                <a href="classes/TowerManager.html" data-type="entity-link" >TowerManager</a>
                            </li>
                            <li class="link">
                                <a href="classes/UserScriptManager.html" data-type="entity-link" >UserScriptManager</a>
                            </li>
                            <li class="link">
                                <a href="classes/Vanguard.html" data-type="entity-link" >Vanguard</a>
                            </li>
                            <li class="link">
                                <a href="classes/WorkRequestManager.html" data-type="entity-link" >WorkRequestManager</a>
                            </li>
                        </ul>
                    </li>
                    <li class="chapter">
                        <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ? 'data-bs-target="#interfaces-links"' :
                            'data-bs-target="#xs-interfaces-links"' }>
                            <span class="icon ion-md-information-circle-outline"></span>
                            <span>Interfaces</span>
                            <span class="icon ion-ios-arrow-down"></span>
                        </div>
                        <ul class="links collapse " ${ isNormalMode ? ' id="interfaces-links"' : 'id="xs-interfaces-links"' }>
                            <li class="link">
                                <a href="interfaces/AdvancedFindDistanceOpts.html" data-type="entity-link" >AdvancedFindDistanceOpts</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/AllyRequest.html" data-type="entity-link" >AllyRequest</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/AnimatedStyle.html" data-type="entity-link" >AnimatedStyle</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/CreepCombatData.html" data-type="entity-link" >CreepCombatData</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/CustomLogOpts.html" data-type="entity-link" >CustomLogOpts</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/DeadCreepNames.html" data-type="entity-link" >DeadCreepNames</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/EnemyThreatData.html" data-type="entity-link" >EnemyThreatData</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/ErrorData.html" data-type="entity-link" >ErrorData</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/FeatureFlagConfig.html" data-type="entity-link" >FeatureFlagConfig</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/FindDynamicStampAnchorArgs.html" data-type="entity-link" >FindDynamicStampAnchorArgs</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/FindDynamicStampAnchorArgs-1.html" data-type="entity-link" >FindDynamicStampAnchorArgs</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/FindDynamicStampAnchorWeightedArgs.html" data-type="entity-link" >FindDynamicStampAnchorWeightedArgs</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/FindDynamicStampAnchorWeightedArgs-1.html" data-type="entity-link" >FindDynamicStampAnchorWeightedArgs</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/FindStampAnchorArgs.html" data-type="entity-link" >FindStampAnchorArgs</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/FindStampAnchorArgs-1.html" data-type="entity-link" >FindStampAnchorArgs</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/InterpretedRoomEvent.html" data-type="entity-link" >InterpretedRoomEvent</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/OutputArgs.html" data-type="entity-link" >OutputArgs</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/PlanStampsArgs.html" data-type="entity-link" >PlanStampsArgs</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/PlanStampsArgs-1.html" data-type="entity-link" >PlanStampsArgs</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/RoomVisual.html" data-type="entity-link" >RoomVisual</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/Settings.html" data-type="entity-link" >Settings</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/SpeechStyle.html" data-type="entity-link" >SpeechStyle</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/TowerDamageCoord.html" data-type="entity-link" >TowerDamageCoord</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/TowerDamageCoord-1.html" data-type="entity-link" >TowerDamageCoord</a>
                            </li>
                        </ul>
                    </li>
                    <li class="chapter">
                        <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ? 'data-bs-target="#miscellaneous-links"'
                            : 'data-bs-target="#xs-miscellaneous-links"' }>
                            <span class="icon ion-ios-cube"></span>
                            <span>Miscellaneous</span>
                            <span class="icon ion-ios-arrow-down"></span>
                        </div>
                        <ul class="links collapse " ${ isNormalMode ? 'id="miscellaneous-links"' : 'id="xs-miscellaneous-links"' }>
                            <li class="link">
                                <a href="miscellaneous/enumerations.html" data-type="entity-link">Enums</a>
                            </li>
                            <li class="link">
                                <a href="miscellaneous/functions.html" data-type="entity-link">Functions</a>
                            </li>
                            <li class="link">
                                <a href="miscellaneous/typealiases.html" data-type="entity-link">Type aliases</a>
                            </li>
                            <li class="link">
                                <a href="miscellaneous/variables.html" data-type="entity-link">Variables</a>
                            </li>
                        </ul>
                    </li>
                    <li class="chapter">
                        <a data-type="chapter-link" href="coverage.html"><span class="icon ion-ios-stats"></span>Documentation coverage</a>
                    </li>
                    <li class="divider"></li>
                    <li class="copyright">
                        Documentation generated using <a href="https://compodoc.app/" target="_blank" rel="noopener noreferrer">
                            <img data-src="images/compodoc-vectorise.png" class="img-responsive" data-type="compodoc-logo">
                        </a>
                    </li>
            </ul>
        </nav>
        `);
        this.innerHTML = tp.strings;
    }
});