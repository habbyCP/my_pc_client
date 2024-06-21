--[[
    JebusMail

    A mail tracking addon based on MailTo and Postman

    With many thanks to the people who wrote:
        - MailTo
        - Postman
        - Silverdragon
        - Cartographer
        - Cooldowntimers2
        - Auctioneer
    Whose code I looked through for ideas or examples.  There may or may not be snippets of code from these addons in here.
]]

local L = AceLibrary("AceLocale-2.2"):new("JebusMail")

--JebusMail = AceLibrary("AceAddon-2.0"):new("AceEvent-2.0", "AceConsole-2.0", "AceDB-2.0", "AceHook-2.1", "AceComm-2.0")
JebusMail = AceLibrary("AceAddon-2.0"):new("AceEvent-2.0", "AceConsole-2.0", "AceDB-2.0", "AceHook-2.1", "AceComm-2.0")
local Dewdrop = AceLibrary("Dewdrop-2.0")

JebusMail:SetCommPrefix("JebusMail")

JebusMail.hasIcon = L["DefaultIcon"]

JebusMail:RegisterDB("JebusMailDB")
JebusMail:RegisterDefaults('profile', {
    announce = {
        chat = true,
        sound = true,
    },
    splitguild = false,
    exclude = 0,
})
JebusMail:RegisterDefaults('server', {
	Horde = {},
	Alliance = {}
})
JebusMail:RegisterDefaults('realm', {
    lastsendto = nil,
    alts = {},
    last = {},
    others = {},
    mailLog = {},
    maxLast = 15,
    vguildsplit = 15,
})

local tblGuildNames = {}
local tblFriendNames = {}
local _,race = UnitRace("player")
--local PlayerFaction = (race == "Tauren" or race == "Orc" or race == "Troll" or race == "Scourge" or race == "BloodElf" or race == "Goblin") and FACTION_HORDE or FACTION_ALLIANCE
--local PlayerOppositeFaction = PlayerFaction == "Horde" and "Alliance" or "Horde"
local PlayerFaction = ""
local PlayerOppositeFaction = ""
if(race == "Tauren" or race == "Orc" or race == "Troll" or race == "Scourge" or race == "BloodElf" or race == "Goblin") then
	PlayerFaction = "Horde"
	PlayerOppositeFaction = "Alliance"
else
	PlayerFaction = "Alliance"
	PlayerOppositeFaction = "Horde"
end
--DEFAULT_CHAT_FRAME:AddMessage("race = ".. race .."; PlayerFaction = "..(PlayerFaction or "nil").."; OppositeFaction = "..PlayerOppositeFaction)

function JebusMail:CompileDropDown()
    local sPlayerName = UnitName("player")

    -- Compile master list of friends if necessary for exclusion from guild list
    local tblMasterFriends = {}
    if self.db.profile.exclude == 1 then
	    if GetNumFriends() > 0 then
			for i=1,GetNumFriends() do
				local sFriendName = GetFriendInfo(i)
				table.insert(tblMasterFriends, sFriendName)
			end
	    end
    end
    
    -- Compile the guild roster as a table
    local tblGuildRoster = {}
    tblGuildNames = {}
    local GuildDisabled = true
    if IsInGuild() then
        GuildRoster()
        GuildDisabled = false
        for i=1,GetNumGuildMembers(true) do
            local sMemberName = GetGuildRosterInfo(i)
            if sMemberName ~= sPlayerName and not JebusMail:TableFind(self.db.realm.alts, sMemberName, 2) and not JebusMail:TableFind(tblMasterFriends, sMemberName, 2) then
                table.insert(tblGuildNames, sMemberName)
            end
        end
        table.sort(tblGuildNames)
        local mylastgroup = 0;
        local mygrouptable = {}
        local JebusMail_Guild = {}
        for k,v in pairs(tblGuildNames) do
            local tTemp = {
                text = v,
                func = function() JebusMail:DropDownSelect(v) end,
            }
            if self.db.profile.splitguild then
                table.insert(mygrouptable, tTemp)
                if ( #mygrouptable == self.db.realm.vguildsplit ) or ( k == #tblGuildNames ) then
                    -- if ( number == maximum per subgroup ) OR  (last element) then
                    JebusMail_Guild = {
                        text = mygrouptable[1].text .. " - " .. mygrouptable[#mygrouptable].text,
                        hasArrow = true,
                        subMenu = mygrouptable,
                        disabled = GuildDisabled,
                    }
                    table.insert(tblGuildRoster, JebusMail_Guild)
                    mygrouptable = {}
                end
            else
                table.insert(tblGuildRoster, tTemp)
            end
        end
    end

    -- Compile the friends table
    ShowFriends()
    local tblFriends = {}
    tblFriendNames = {}
    local FriendsDisabled = true
    if GetNumFriends() > 0 then
        FriendsDisabled = false
        for i=1,GetNumFriends() do
            local sFriendName = GetFriendInfo(i)
            if not JebusMail:TableFind(tblGuildNames, sFriendName, 1) then
                table.insert(tblFriendNames, sFriendName)
            end
        end
        table.sort(tblFriendNames)
        for k,v in pairs(tblFriendNames) do
            local tTemp = {
                text = v,
                func = function() JebusMail:DropDownSelect(v) end,
            }
            table.insert(tblFriends, tTemp)
        end
    end

    -- compile Alts table
    local tblAlts = {}
    local tblRemoveAlts = {}
    local AltsDisabled = true
	local OtherAltsDisabled = true
    for k,v in pairs(self.db.realm.alts) do
        if v ~= sPlayerName then
            AltsDisabled = false
            local tTemp = {
                text = v,
                func = function() JebusMail:DropDownSelect(v) end,
            }
            table.insert(tblAlts, tTemp)
            tTemp = {
                text = v,
                func = function() JebusMail:DropDownRemove("alt", k) end,
            }
            table.insert(tblRemoveAlts, tTemp)
        end
    end
	-- compile Opposite side Alts Table (to go as a sub-table of Alts)
	local tblOtherAlts = {}
	for k,v in pairs(self.db.server[PlayerOppositeFaction]) do
		OtherAltsDisabled = false
		local tTemp = {
			text = v,
			func = function () JebusMail:DropDownSelect(v) end,
		}
		table.insert(tblOtherAlts, tTemp)
	end
	table.insert(tblAlts, {
		text = PlayerOppositeFaction,
		hasArrow = true,
		subMenu = tblOtherAlts,
		disabled = OtherAltsDisabled,
	})

    -- compile Last table
    --DEFAULT_CHAT_FRAME:AddMessage("self.db.realm.maxLast: "..self.db.realm.maxLast)
    local tblLast = {}
    local LastDisabled = true
    if #self.db.realm.last > 0  then
        while #self.db.realm.last > self.db.realm.maxLast do
            table.remove(self.db.realm.last,#self.db.realm.last)
        end
    end

    for k,v in pairs(self.db.realm.last) do
        if v ~= sPlayerName then
            LastDisabled = false
        local tTemp = {
                text = v,
                func = function() JebusMail:DropDownSelect(v) end,
            }
            table.insert(tblLast, tTemp)
        end
    end

    -- compile Others Table
    local tblOthers = {}
    local tblRemoveOthers = {}
    local OthersDisabled = true
    for k,v in pairs(self.db.realm.others) do
        if not JebusMail:TableFind(tblGuildNames, v, -1) and not JebusMail:TableFind(tblFriends, v, -1) then
            OthersDisabled = false
            local tTemp = {
                text = v,
                func = function() JebusMail:DropDownSelect(v) end,
            }
            table.insert(tblOthers, tTemp)
            tTemp = {
                text = v,
                func = function() JebusMail:DropDownRemove("other", k) end,
            }
            table.insert(tblRemoveOthers, tTemp)
        end
    end

    -- set up Removal menu
    local tblRemove = {
        RemAlts = {
            text = L["Alts"],
            hasArrow = true,
            subMenu = tblRemoveAlts,
            disabled = AltsDisabled,
        },
        RemOthers = {
            text = L["Others"],
            hasArrow = true,
            subMenu = tblRemoveOthers,
            disabled = OthersDisabled,
        },
    }
	
	-- set up Alts menu
--[[	local tblOtherAltsMenu = {
		OtherAlts = {
			text = PlayerOppositeFaction,
			hasArrow = true,
			subMenu = tblOtherAlts,
			disabled = OtherAltsDisabled,
		},
	}
	table.insert(tblAlts, tblOtherAltsMenu)]]

    Dewdrop:Register("JebusMail", 'children', function()
        Dewdrop:FeedTable({
            Guild = {
                text = L["Guild Members"],
                hasArrow = true,
                subMenu = tblGuildRoster,
                disabled = GuildDisabled,
            },
            Friends = {
                text = L["Friends"],
                hasArrow = true,
                subMenu = tblFriends,
                disabled = FriendsDisabled,
            },
            Alts = {
                text = L["Alts"],
                hasArrow = true,
                subMenu = tblAlts,
                disabled = AltsDisabled,
            },
--[[			Alts = {
                text = L["Alts"],
                hasArrow = true,
                subMenu = tblAltsMenu,
                disabled = AltsDisabled,
			},]]
            Others = {
                text = L["Others"],
                hasArrow = true,
                subMenu = tblOthers,
                disabled = OthersDisabled,
            },
            Last = {
                text = L["Last"],
                hasArrow = true,
                subMenu = tblLast,
                disabled = LastDisabled,
            },
            Remove_a = {
                text = "",
                disabled = true,
            },
            Remove_b = {
                text = L["Remove"],
                hasArrow = true,
                subMenu = tblRemove,
            },
			ZClose_a = {
				text = "",
				disabled = true,
			},
			ZClose_b = {
				text = L["Close"],
				hasArrow = false,
				func = function() JebusMail:DropDownClose() end,
			},
        })
    end, "cursorX", true, "cursorY", true)
end

--[[function JebusMail:IsLetterBetween(sLetter, sLo, sHi)
    local ret = false
    if strbyte(strupper(sLetter)) then
        if (strbyte(strupper(sLetter)) >= strbyte(strupper(sLo)) and strbyte(strupper(sLetter)) <= strbyte(strupper(sHi))) then
            ret = true
        end
    end

    return ret
end]]

function JebusMail:OnInitialize()
    local tblOptions = {
        handler = JebusMail,
        type = "group",
        args = {
            DeliveryMsg = {
                name = L["Delivery Notification Message"],
                desc = L["Display a message when mail has arrived."],
                type = "toggle",
                get = "GetDeliveryMsg",
                set = "SetDeliveryMsg",
            },
            DeliverySound = {
                name = L["Delivery Notification Sound"],
                desc = L["Play sound when mail has arrived."],
                type = "toggle",
                get = "GetDeliverySound",
                set = "SetDeliverySound",
            },
            maxLast = {
                type = 'text',
                name = 'MaxLast',
                desc = L["How many recipients do you want to remember ?"],
                usage = "<Your Value>",
                get = function()
                    return self.db.realm.maxLast
                end,
                set = function(new_value)
                    self.db.realm.maxLast = new_value
                end,
            },
            SplitGuild = {
                name = L["Split guild list"],
                desc = L["Split the guild list into groups.  Good for large guilds."],
                type = "toggle",
                get = "GetSplitGuild",
                set = "SetSplitGuild",
            },
            VGuildSplit = {
                name = L["Variable Guild List Split"],
                desc = L["How many guild members should be in one subfolder ?"],
                usage = "<Your Value>",
                type = "text",
                get = function() return self.db.realm.vguildsplit end,
                set = function(new_value)
				JebusMail_Setvguildsplit(new_value)
				self.panel.vguildsplit:SetValue(self.db.realm.vguildsplit)
			end,
            },
            Log = {
                name = L["Mail Log"],
                desc = L["Display the Mail Log"],
                type = "execute",
                func = function() self:DisplayInTransit(true) end,
            },
        },
    }
    self.OnMenuRequest = tblOptions

    self:RegisterChatCommand({'/JebusMail', "/jm"}, tblOptions)
	
	-- if this character's faction list is empty, copy the alt list into it.
	if(self.db.server[PlayerFaction] ~= nil) then
		if table.getn(self.db.server[PlayerFaction]) == 0 then
			self.db.server[PlayerFaction] = self.db.realm.alts
		end
	end

    -- If this character hasn't been added to the alt list, add it now
    if not JebusMail:TableFind(self.db.realm.alts, UnitName("player"), -1) then
        local sPlayerName = UnitName("player")
        table.insert(self.db.realm.alts, sPlayerName)
        table.sort(self.db.realm.alts)
		-- add to the Horde/Alliance list as well
		table.insert(self.db.server[PlayerFaction], sPlayerName)
		table.sort(self.db.server[PlayerFaction])
    end

    self.reccash = {
        total  = 0,
        sales = 0,
        refun = 0,
        other = 0
    }
end

-- create a basic slider, code is a modified code from Tuller's addon 'OmniCC'
--do
    local function Slider_OnMouseWheel(self, arg1)
        local step = self:GetValueStep() * arg1
        local value = self:GetValue()
        local minVal, maxVal = self:GetMinMaxValues()

        if step > 0 then
            self:SetValue(min(value+step, maxVal))
        else
            self:SetValue(max(value+step, minVal))
        end
    end

    function JebusMail:CreateSlider(name, parent, low, high, step)
        local slider = CreateFrame('Slider', name, parent, 'OptionsSliderTemplate')
        slider:SetScript('OnMouseWheel', Slider_OnMouseWheel)
        slider:SetMinMaxValues(low, high)
        slider:SetValueStep(step)
        slider:EnableMouseWheel(true)
        BlizzardOptionsPanel_Slider_Enable(slider) --colors the slider properly

        --getglobal(name .. 'Text'):SetText(text)
        getglobal(name .. 'Low'):SetText('')
        getglobal(name .. 'High'):SetText('')

        local text = slider:CreateFontString(nil, 'BACKGROUND')
        text:SetFontObject('GameFontHighlightSmall')
        text:SetPoint('LEFT', slider, 'RIGHT', 7, 0)
        slider.valText = text

        return slider
    end
--end


function JebusMail:OnEnable()
    if not self.frmDropDown then
        -- create frames
        self.frmDropDown = CreateFrame("Frame", "FrameDropDown", SendMailFrame)
        --self.frmDropDown:EnableMouse(true)
        self.frmDropDown:SetWidth(24)
        self.frmDropDown:SetHeight(24)
        self.frmDropDown:SetPoint("LEFT",SendMailNameEditBox,"RIGHT",-6,0)

        self.btnDropDown = CreateFrame("Button", "ButtonDropDown", FrameDropDown)
        self.btnDropDown:SetWidth(24)
        self.btnDropDown:SetHeight(24)
        self.btnDropDown:SetPoint("LEFT", FrameDropDown)
        local textureNormal = self.btnDropDown:CreateTexture("DropDownNormal", "ARTWORK")
        textureNormal:SetTexture("Interface\\ChatFrame\\UI-ChatIcon-ScrollDown-Up")
        textureNormal:SetPoint("RIGHT", ButtonDropDown)
        textureNormal:SetWidth(24)
        textureNormal:SetHeight(24)
        local textureHighlight = self.btnDropDown:CreateTexture("DropDownHighlight", "ARTWORK")
        textureHighlight:SetTexture("Interface\\Buttons\\UI-Common-MouseHilight")
        textureHighlight:SetPoint("RIGHT", ButtonDropDown)
        textureHighlight:SetWidth(24)
        textureHighlight:SetHeight(24)
        local texturePushed = self.btnDropDown:CreateTexture("DropDownPushed", "ARTWORK")
        texturePushed:SetTexture("Interface\\ChatFrame\\UI-ChatIcon-ScrollDown-Down")
        texturePushed:SetPoint("RIGHT", ButtonDropDown)
        texturePushed:SetWidth(24)
        texturePushed:SetHeight(24)
        self.btnDropDown:SetNormalTexture(textureNormal)
        self.btnDropDown:SetHighlightTexture(textureHighlight)
        self.btnDropDown:SetPushedTexture(texturePushed)
        --[[
        self.btnDropDown:SetNormalTexture("Interface\ChatFrame\UI-ChatIcon-ScrollDown-Up")
        self.btnDropDown:SetHighlightTexture("Interface\Buttons\UI-Common-MouseHilight")
        self.btnDropDown:SetPushedTexture("Interface\ChatFrame\UI-ChatIcon-ScrollDown-Down")
        ]]

--		self.btnDropDown:SetScript("OnEnter", btnDropDown_OnEnter)
--		self.btnDropDown:SetScript("OnLeave",btnDropDown_OnLeave)
--		self.btnDropDown:SetScript("OnClick", btnDropDown_OnClick)
--		self.btnDropDown:SetScript("OnShow", btnDropDown_OnShow)
        self.btnDropDown:SetScript("OnEnter", 
			function()
				self:btnDropDown_OnEnter()
			end
		)
        self.btnDropDown:SetScript("OnLeave",
			function()
				self:btnDropDown_OnLeave()
			end
		)
        self.btnDropDown:SetScript("OnClick", 
			function()
				self:btnDropDown_OnClick()
			end
		)
        self.btnDropDown:SetScript("OnShow", 
			function()
				self:btnDropDown_OnShow()
			end
		)

        -- Create UI Options frame (WoW 2.4)
        self.panel = CreateFrame("FRAME", "OptionPanel")
        self.panel.name = "JebusMail"
        -- Title Text
        local title = self.panel:CreateFontString("JebusMailTitle", "ARTWORK", "GameFontNormalLarge")
        title:SetJustifyH("LEFT")
        title:SetJustifyV("TOP")
        title:SetPoint("TOPLEFT", 16, -16)
        title:SetText(self.panel.name)
        -- Title Sub-Text
        local subText = self.panel:CreateFontString("JebusMailSubText", "ARTWORK", "GameFontHighlightSmall")
        subText:SetJustifyH("LEFT")
        subText:SetJustifyV("TOP")
        subText:SetPoint("TOPLEFT", title, "BOTTOMLEFT", 0, -8)
        subText:SetPoint("RIGHT", -32, 0)
        subText:SetNonSpaceWrap(true)
        subText:SetHeight(32)
        subText:SetWidth(0)
        subText:SetText(L["These options affect the behaviour of the JebusMail addon."])
        -- Delivery Notification checkbox
        self.panel.chkDeliveryMsg = CreateFrame("CheckButton", "chkDeliveryMsg", self.panel, "InterfaceOptionsCheckButtonTemplate")
        self.panel.chkDeliveryMsg:SetPoint("TOPLEFT", subText, "BOTTOMLEFT", 0, -8)
        getglobal(self.panel.chkDeliveryMsg:GetName().."Text"):SetText(L["Delivery Notification Message"])
        self.panel.chkDeliveryMsg.tooltipText = L["Display a message when mail has arrived."]
        self.panel.chkDeliveryMsg:SetChecked(self.db.profile.announce.chat)
        self.panel.chkDeliveryMsg.savedVar = "self.db.profile.announce.chat"
        self.panel.chkDeliveryMsg.setFunc = function(value) self:SetDeliveryMsg(value) end
        BlizzardOptionsPanel_RegisterControl(self.panel.chkDeliveryMsg, self.panel)
        -- Delivery Notification sound checkbox
        self.panel.chkDeliverySnd = CreateFrame("CheckButton", "chkDeliverySnd", self.panel, "InterfaceOptionsCheckButtonTemplate")
        self.panel.chkDeliverySnd:SetPoint("TOPLEFT", self.panel.chkDeliveryMsg, "BOTTOMLEFT", 0, -8)
        getglobal(self.panel.chkDeliverySnd:GetName().."Text"):SetText(L["Delivery Notification Sound"])
        self.panel.chkDeliverySnd.tooltipText = L["Play sound when mail has arrived."]
        self.panel.chkDeliverySnd:SetChecked(self.db.profile.announce.sound)
        self.panel.chkDeliverySnd.savedVar = "self.db.profile.announce.sound"
        self.panel.chkDeliverySnd.setFunc = function(value) self:SetDeliverySound(value) end
        BlizzardOptionsPanel_RegisterControl(self.panel.chkDeliverySnd, self.panel)
        -- Split Guild Checkbox
        self.panel.chkSplitGuild = CreateFrame("CheckButton", "chkSplitGuild", self.panel, "InterfaceOptionsCheckButtonTemplate")
        self.panel.chkSplitGuild:SetPoint("TOPLEFT", self.panel.chkDeliverySnd, "BOTTOMLEFT", 0, -8)
        getglobal(self.panel.chkSplitGuild:GetName().."Text"):SetText(L["Split guild list"])
        self.panel.chkSplitGuild.tooltipText = L["Split the guild list into groups.  Good for large guilds."]
        self.panel.chkSplitGuild:SetChecked(self.db.profile.splitguild)
        self.panel.chkSplitGuild.savedVar = "self.db.profile.splitguild"
        self.panel.chkSplitGuild.setFunc = function(value) self:SetSplitGuild(value) end
        BlizzardOptionsPanel_RegisterControl(self.panel.chkSplitGuild, self.panel)
        -- variable guild split
        self.panel.vguildsplit = JebusMail:CreateSlider("vguildsplitSlider", self.panel, 5, 50, 1)
        self.panel.vguildsplit:SetPoint("TOPLEFT", self.panel.chkSplitGuild, "BOTTOMLEFT", 0, -15)
        getglobal("vguildsplitSlider".."Text"):SetText(L["Variable Guild List Split"])
        self.panel.vguildsplit:SetValue(self.db.realm.vguildsplit)
        self.panel.vguildsplit.savedVar = "self.db.realm.vguildsplit"
        self.panel.vguildsplit:SetScript("OnValueChanged", function(self) JebusMail_Setvguildsplit(self:GetValue()); end)
        self.panel.vguildsplit.tooltipText = L["How many guild members should be in one subfolder ?"] .. " (" .. self.db.realm.vguildsplit ..")"
        BlizzardOptionsPanel_RegisterControl(self.panel.vguildsplit, self.panel)
        -- maxLast
        self.panel.maxLast = JebusMail:CreateSlider("maxLastSlider", self.panel, 0, 30, 1)
        self.panel.maxLast:SetPoint("TOPLEFT", self.panel.vguildsplit, "BOTTOMLEFT", 0, -15)
        getglobal("maxLastSlider".."Text"):SetText(L["Remember last recipients"])
        self.panel.maxLast:SetValue(self.db.realm.maxLast)
        self.panel.maxLast.savedVar = "self.db.realm.maxLast"
        self.panel.maxLast:SetScript("OnValueChanged", function(self) JebusMail_SetmaxLast(self:GetValue()); end)
        self.panel.maxLast.tooltipText = L["How many recipients do you want to remember ?"] .. " (" .. self.db.realm.maxLast ..")"
        BlizzardOptionsPanel_RegisterControl(self.panel.maxLast, self.panel)
	-- Exclusion options
	local txtExclude = self.panel:CreateFontString("JM_Exclude", "ARTWORK", "GameFontHighlightMedium")
        txtExclude:SetJustifyH("LEFT")
        txtExclude:SetJustifyV("TOP")
        txtExclude:SetPoint("TOPLEFT", self.panel.maxLast, "BOTTOMLEFT", 0, -8)
        txtExclude:SetNonSpaceWrap(true)
        txtExclude:SetHeight(16)
        txtExclude:SetWidth(0)
        txtExclude:SetText(L["Exclude:"])
	-- Exclude: None checkbox
--        self.panel.chkExclude0 = CreateFrame("CheckButton", "chkExclude0", self.panel, "InterfaceOptionsCheckButtonTemplate")
        self.panel.chkExclude0 = CreateFrame("CheckButton", "chkExclude0", self.panel, "UIRadioButtonTemplate")
        self.panel.chkExclude0:SetPoint("TOPLEFT", txtExclude, "TOPRIGHT", 0, 4)
        getglobal(self.panel.chkExclude0:GetName().."Text"):SetText(L["Nothing"])
        self.panel.chkExclude0.tooltipText = L["Do not remove anyone from any list."]
        self.panel.chkExclude0:SetChecked(self.db.profile.exclude == 0)
        self.panel.chkExclude0.savedVar = "self.db.profile.exclude"
--        self.panel.chkExclude0.setFunc = function(value) self:SetExclude(0, value) end
        self.panel.chkExclude0:SetScript("OnClick", function(value) self:SetExclude(0, value) end)
        BlizzardOptionsPanel_RegisterControl(self.panel.chkExclude0, self.panel)
	-- Exclude: Friends from Guild checkbox
        self.panel.chkExclude1 = CreateFrame("CheckButton", "chkExclude1", self.panel, "UIRadioButtonTemplate")
        self.panel.chkExclude1:SetPoint("TOPLEFT", self.panel.chkExclude0, "BOTTOMLEFT", 0, 0)
        getglobal(self.panel.chkExclude1:GetName().."Text"):SetText(L["Friends from Guild list"])
        self.panel.chkExclude1.tooltipText = L["Removes friends from the guild members list."]
        self.panel.chkExclude1:SetChecked(self.db.profile.exclude == 1)
        self.panel.chkExclude1.savedVar = "self.db.profile.exclude"
--        self.panel.chkExclude1.setFunc = function(value) self:SetExclude(1, value) end
        self.panel.chkExclude1:SetScript("OnClick", function(value) self:SetExclude(1, value) end)
        BlizzardOptionsPanel_RegisterControl(self.panel.chkExclude1, self.panel)
	-- Exclude: Guild from Friends checkbox
        self.panel.chkExclude2 = CreateFrame("CheckButton", "chkExclude2", self.panel, "UIRadioButtonTemplate")
        self.panel.chkExclude2:SetPoint("TOPLEFT", self.panel.chkExclude1, "BOTTOMLEFT", 0, 0)
        getglobal(self.panel.chkExclude2:GetName().."Text"):SetText(L["Guild members from Friends list"])
        self.panel.chkExclude2.tooltipText = L["Removes guild members from the friends list."]
        self.panel.chkExclude2:SetChecked(self.db.profile.exclude == 2)
        self.panel.chkExclude2.savedVar = "self.db.profile.exclude"
--        self.panel.chkExclude2.setFunc = function(value) self:SetExclude(2, value) end
        self.panel.chkExclude2:SetScript("OnClick", function(value) self:SetExclude(2, value) end)
        BlizzardOptionsPanel_RegisterControl(self.panel.chkExclude2, self.panel)
        -- Mail Log Button
        self.panel.btnMailLog = CreateFrame("Button", "btnMailLog", self.panel, "OptionsButtonTemplate")
        self.panel.btnMailLog:SetPoint("TOPLEFT", txtExclude, "BOTTOMLEFT", 0, -64)
        self.panel.btnMailLog:SetText(L["Mail Log"])
        self.panel.btnMailLog.tooltipText = L["Display the Mail Log"]
        self.panel.btnMailLog:SetScript("OnClick", function() self:DisplayInTransit(true) end)
        BlizzardOptionsPanel_RegisterControl(self.panel.btnMailLog, self.panel)
        InterfaceOptions_AddCategory(self.panel)
    else
        self.frmDropDown:Show()
    end

    -- Comm Interface
    self:RegisterComm(self.commPrefix, "WHISPER", "ReceiveMessage")
    
    -- register events
    self:RegisterEvent("MAIL_CLOSED", "OnMailClosed")
    self:RegisterEvent("CHAT_MSG_SYSTEM", "OnSystemMsg")

    -- register hooks
    self:Hook("SendMailFrame_SendMail", "SendMail", true)
    --self:Hook("SendMailFrame_SendeeAutocomplete", "ToBoxAutoComplete", true)
    self:Hook("InboxFrame_OnClick", "TakeItem", true)
    self:HookScript(SendMailNameEditBox, "OnEditFocusGained", "FillToBox")

    -- schedule event to process messages
    self:ScheduleEvent(self.ProcessMailLog, 5, self)
    self:ScheduleEvent(self.DisplayInTransit, 5, self)
end

function JebusMail:OnDisable()
    self:UnregisterAllEvents()
    self:UnHookAll()
    self.frmDropDown:Hide()
end

function JebusMail:OnMailClosed()
    if Dewdrop:IsOpen("JebusMail") then Dewdrop:Close() end
    if self.reccash.total > 0 then
        local sTotal = self:getTextGSC(self.reccash.total)
        local sSales = self:getTextGSC(self.reccash.sales)
        local sRefun = self:getTextGSC(self.reccash.refun)
        local sOther = self:getTextGSC(self.reccash.other)
        self:Print(string.format(L["Received cash: Total=%s, Sales=%s, Refunds=%s, Other=%s"], sTotal, sSales, sRefun, sOther))
        self.reccash = {
            total  = 0,
            sales = 0,
            refun = 0,
            other = 0
        }
    end
end

function JebusMail:OnSystemMsg(msg)
    -- keep our eyes out for auctions that have been bought out and log for their arrival
    if string.find(msg, L["A buyer has been found for your auction of "]) then
        local sItemName = string.gsub(msg, L["A buyer has been found for your auction of "], "")    -- remove the beginning part of the message
        sItemName =string.format(L["%s sales revenue"], string.sub(sItemName, 1, -2))   -- chopping off the trailing "."
        local iWaitTime = 60 * 60
        table.insert(self.db.realm.mailLog, {
            to = UnitName("player"),
            from = L["Auction House"],
            attachment = sItemName,
            t = time() + iWaitTime
        })
        if not self.NextLogCheck or self.NextLogCheck > iWaitTime then
            self.NextLogCheck = self:ScheduleEvent(self.ProcessMailLog, iWaitTime, self)
        end
    end
end

--function btnDropDown_OnShow()
function JebusMail:btnDropDown_OnShow()
   --[[ this.tooltip = L["Select a recipient"]
    UIDropDownMenu_Initialize(this:GetParent(), JebusMail.RecipMenuInit)
    UIDropDownMenu_SetAnchor(0, 0, this:GetParent(), "TOPRIGHT", this:GetName(), "BOTTOMRIGHT")]]
end

--function btnDropDown_OnEnter()
function JebusMail:btnDropDown_OnEnter()
    GameTooltip:SetOwner(this,"ANCHOR_TOPRIGHT")
    GameTooltip:SetText(L["Select a recipient"])
end

--function btnDropDown_OnLeave()
function JebusMail:btnDropDown_OnLeave()
    GameTooltip:Hide()
end

--function btnDropDown_OnClick()
function JebusMail:btnDropDown_OnClick()
    JebusMail:CompileDropDown() -- compile dropdown list just before displaying it to make sure we have a fresh list every time
    Dewdrop:Open("JebusMail")
end

function JebusMail:DropDownSelect(name)
    SendMailNameEditBox:SetText(name)
    SendMailSubjectEditBox:SetFocus()
    Dewdrop:Close()
end

function JebusMail:DropDownRemove(section, index)
    local name
    if section == "alt" then
        name = self.db.realm.alts[index]
        table.remove(self.db.realm.alts, index)
		table.remove(self.db.server[PlayerFaction], index)	-- Remove from global list as well
    end
    if section == "other" then
        name = self.db.realm.others[index]
        table.remove(self.db.realm.others, index)
    end
    self:Print(string.format(L["%s removed from %s list."], name, section))
    Dewdrop:Close() -- force recompilation of dropdown
end

function JebusMail:DropDownClose()
	Dewdrop:Close()
end

function JebusMail:TableFind(t,s,e)
    local ret = nil
    if (e ~= self.db.profile.exclude and self.db.profile.exclude ~= 0) or e < 0 then
	    if t then
		for k,v in pairs(t) do
		    if v==s then ret = k end
		end
	    end
    end
    return ret
end

function JebusMail:SendMail()
    local sTo = SendMailNameEditBox:GetText()

    -- don't track if sendee and sender are the same
    if (sTo == UnitName("player")) then
        self.hooks["SendMailFrame_SendMail"]()
        return
    end

    self.db.realm.lastsendto = sTo
    SendMailNameEditBox:ClearFocus()

    local iWaitTime = 60 * 61   -- wait a little longer than an hour because delivery isn't 100% accurate

    -- save sendee in Other list if it's not included in any other list
    local inAlts = self:TableFind(self.db.realm.alts, sTo, -1)
	if not inAlts then
		-- Not in the player's faction, check opposite side to see if the name exists.  Sending Heriloom items cross-faction is allowed and instant
		inAlts = self:TableFind(self.db.server[PlayerOppositeFaction], sTo, -1)
	end
    local inOthers = self:TableFind(self.db.realm.others, sTo, -1)
    local inGuild = self:TableFind(tblGuildNames, sTo, -1)
    local inFriends = self:TableFind(tblFriendNames, sTo, -1)
    if not inAlts and not inOthers and not inGuild and not inFriends then
        table.insert(self.db.realm.others, sTo)
        table.sort(self.db.realm.others)
    end

    -- save sendee in Last list if it's not included already
    local inLast = self:TableFind(self.db.realm.last, sTo, -1)
    if not inLast then
        table.insert(self.db.realm.last, 1, sTo)
        --table.sort(self.db.realm.last)
    else
        local l_index = JebusMail:TableFind(self.db.realm.last, sTo, -1)
        table.remove(self.db.realm.last, l_index)
        table.insert(self.db.realm.last, 1, sTo)
    end

    -- prepare a notification as long as the recipient isn't an alt, those are received immedieately
    if not inAlts then
        -- See if we are sending an item and/or money
        local name, _, count = GetSendMailItem()    -- name, texture, count
        local amount = MoneyInputFrame_GetCopper(SendMailMoney)
        local attachment
        if name or (amount > 0) and not inAlts then
            if name then
                -- we're sending an item
                name:trim()
                if count > 1 then
                    sAttachment = count .. "x" .. name
                else
                    sAttachment = name
                end
                if amount > 0 then
                    -- and we're sending money
                    money = self:getTextGSC(amount)
                    if SendMailCODButton:GetChecked() then
                        sAttachment = sAttachment .. " for " .. money .. " (COD)"
                    else
                        sAttachment = sAttachment .. " and " .. money
                    end
                end
            else
                -- we're only sending money
                money = self:getTextGSC(amount)
                if SendMailCODButton:GetChecked() then
                    sAttachment = money .. " (COD)"
                else
                    sAttachment = money
                end
            end
            table.insert(self.db.realm.mailLog, {
                to = sTo,
                from = UnitName("player"),
                attachment = sAttachment,
                t = time() + iWaitTime
            })
            self:Print(L["%s sent to %s by %s is due in %d min."]:format(sAttachment, sTo, UnitName("player"), iWaitTime / 60))
	    -- Send Comm message to receiver, that way they get a log entry as well
--		DEFAULT_CHAT_FRAME:AddMessage("UnitIsConnected("..sTo..") = "..(UnitIsConnected(sTo) or "nil"))
--		if UnitIsConnected(sTo) == 1 then
			JebusMail:SendCommMessage("WHISPER", sTo, UnitName("player"), sAttachment, iWaitTime)
--		end

            if not self.NextLogCheck then
                self.NextLogCheck = self:ScheduleEvent(self.ProcessMailLog, iWaitTime, self)
            end
        end
    end

    self.hooks["SendMailFrame_SendMail"]()
end

function JebusMail:getGSC(money)
    if (money == nil) then money = 0 end
    local g = math.floor(money / 10000)
    local s = math.floor((money - (g*10000)) / 100)
    local c = math.ceil(money - (g*10000) - (s*100))
    return g,s,c
end

function JebusMail:getTextGSC(money)
    if (type(money) ~= "number") then return end

    local TEXT_NONE = "0"

    local GSC_GOLD="ffd100"
    --local GSC_SILVER="e6e6e6" -- original line
    local GSC_SILVER="a0a0a0"
    local GSC_COPPER="c8602c"
    local GSC_START="|cff%s%d%s|r"
    local GSC_PART=".|cff%s%02d%s|r"
    --local GSC_NONE="|cffa0a0a0"..TEXT_NONE.."|r"  -- original line
    local GSC_NONE="|cffffffff"..TEXT_NONE.."|r"

    if (not money) then money = 0 end

    local g, s, c = self:getGSC(money)
    local gsc = ""
    local fmt = GSC_START
    if (g > 0) then gsc = gsc..string.format(fmt, GSC_GOLD, g, 'g') fmt = GSC_PART end
    if (s > 0) then gsc = gsc..string.format(fmt, GSC_SILVER, s, 's') fmt = GSC_PART end
    if (c > 0) then gsc = gsc..string.format(fmt, GSC_COPPER, c, 'c') end

    if (gsc == "") then gsc = GSC_NONE end

    return gsc
end

function JebusMail:ToBoxAutoComplete()
    local sToBox = this:GetText()

    -- check against alts
    for _, sName in pairs(self.db.realm.alts) do
        if self:StringMatch(sToBox, sName) and sName ~= UnitName("player") then
            return
        end
    end
    -- check against others
    for _, sName in pairs(self.db.realm.others) do
        if self:StringMatch(sToBox, sName) and sName ~= UnitName("player") then
            return
        end
    end
    self.hooks["SendMailFrame_SendeeAutocomplete"]()
end

function JebusMail:StringMatch(str1, str2)
    if str2 and str2:lower():find(str1:lower(), 1, true) == 1 then
        this:SetText(str2)
        this:HighlightText(strlen(str1), -1)
        return true
    end
    return false
end

function JebusMail:FillToBox(oToBox)
    if oToBox:GetText() == "" and self.db.realm.lastsendto and self.db.realm.lastsendto ~= UnitName("player") then
        oToBox:SetText(self.db.realm.lastsendto)
    else
		if oToBox:GetText() == "" and self.db.realm.last[2] then
			oToBox:SetText(self.db.realm.last[2])
		end
    end
    oToBox:HighlightText(0,-1)
    self.hooks[oToBox].OnEditFocusGained()
end

function JebusMail:ProcessMailLog()
    local now = time()
    local bRangBell = false
    local tblDelivered = {}
    local NextCheck

    for i, mail in pairs(self.db.realm.mailLog) do
        if mail.t > now then
            if not NextCheck or mail.t < NextCheck then
                NextCheck = mail.t
            end
        else
            if self.db.profile.announce.chat then
                self:Print(L["%s from %s has been delivered to %s."]:format(mail.attachment, mail.from, mail.to))
            end
            if self.db.profile.announce.sound and not bRangBell then
                PlaySound("AuctionWindowOpen")
                bRangBell = true
            end
            table.insert(tblDelivered, i)
        end
    end

    for k, v in pairs(tblDelivered) do
        table.remove(self.db.realm.mailLog or {}, v - (k - 1))
    end
    if NextCheck then
        self.NextLogCheck = self:ScheduleEvent(self.ProcessMailLog, NextCheck - now, self)
    end
end

function JebusMail:DisplayInTransit(bForce)
    local now = time()
    local bDisplayed = false

    for i,mail in pairs(self.db.realm.mailLog) do
        if self.db.profile.announce.chat and (mail.t - now) / 60 + 1 >= 0 then
            bDisplayed = true
            self:Print(L["%s sent to %s by %s is due in %d min."]:format(mail.attachment, mail.to, mail.from, (mail.t - now) / 60 + 1))
        end
    end
    if not bDisplayed and bForce then
        self:Print(L["The mail log is empty."])
    end
end

function JebusMail:GetDeliveryMsg()
    return self.db.profile.announce.chat
end

function JebusMail:SetDeliveryMsg(value)
    if type(value) == "boolean" then
        value = not self.db.profile.announce.chat
        if value then
            value = 1
        else
            value = 0
        end
    else
        value = tonumber(value)
    end
    if value and value > 0 then
        self.db.profile.announce.chat = value
        self.panel.chkDeliveryMsg:SetChecked(value)
    else
        self.db.profile.announce.chat = false
        self.panel.chkDeliveryMsg:SetChecked(0)
    end
end

local function JebusMail_Setvguildsplit(value)
    --DEFAULT_CHAT_FRAME:AddMessage("CHANGED to value: "..value)
    JebusMail.db.realm.vguildsplit = value
    --DEFAULT_CHAT_FRAME:AddMessage("JebusMail.db.realm.vguildsplit: "..JebusMail.db.realm.vguildsplit);

     local myTooltipText = L["How many guild members should be in one subfolder ?"] .. ": " .. value;
     JebusMail.panel.vguildsplit.tooltipText = myTooltipText;
     GameTooltip:SetText(myTooltipText, nil, nil, nil, nil, 1);
     --DEFAULT_CHAT_FRAME:AddMessage("myTooltipText: "..myTooltipText)
     GameTooltip:Show();
end

local function JebusMail_SetmaxLast(value)
    --DEFAULT_CHAT_FRAME:AddMessage("CHANGED to value: "..value)
    JebusMail.db.realm.maxLast = value
    --DEFAULT_CHAT_FRAME:AddMessage("JebusMail.db.realm.maxLast: "..JebusMail.db.realm.maxLast);

     local myTooltipText = L["How many recipients do you want to remember ?"] .. ": " .. value;
     JebusMail.panel.maxLast.tooltipText = myTooltipText;
     GameTooltip:SetText(myTooltipText, nil, nil, nil, nil, 1);
     --DEFAULT_CHAT_FRAME:AddMessage("myTooltipText: "..myTooltipText)
     GameTooltip:Show();
end

function JebusMail:GetDeliverySound()
    return self.db.profile.announce.sound
end

function JebusMail:SetDeliverySound(value)
    if type(value) == "boolean" then
        value = not self.db.profile.announce.sound
        if value then
            value = 1
        else
            value = 0
        end
    else
        value = tonumber(value)
    end
    if value and value > 0 then
        self.db.profile.announce.sound = value
        self.panel.chkDeliverySnd:SetChecked(value)
    else
        self.db.profile.announce.sound = false
        self.panel.chkDeliverySnd:SetChecked(0)
    end
end

function JebusMail:GetSplitGuild()
    return self.db.profile.splitguild
end

function JebusMail:SetSplitGuild(value)
    if type(value) == "boolean" then
        value = not self.db.profile.splitguild
        if value then
            value = 1
        else
            value = 0
        end
    else
        value = tonumber(value) -- value is a string?!?!
    end
    if value and value > 0 then
        self.db.profile.splitguild = value
        self.panel.chkSplitGuild:SetChecked(value)
    else
        self.db.profile.splitguild = false
        self.panel.chkSplitGuild:SetChecked(0)
    end
end

function JebusMail:SetExclude(value, chk)
	self.db.profile.exclude = value
	
	if (value == 0) then
		self.panel.chkExclude0:SetChecked(true)
		self.panel.chkExclude1:SetChecked(false)
		self.panel.chkExclude2:SetChecked(false)
	elseif (value == 1) then
		self.panel.chkExclude0:SetChecked(false)
		self.panel.chkExclude1:SetChecked(true)
		self.panel.chkExclude2:SetChecked(false)
	elseif (value == 2) then
		self.panel.chkExclude0:SetChecked(false)
		self.panel.chkExclude1:SetChecked(false)
		self.panel.chkExclude2:SetChecked(true)
	end
end

function JebusMail:TakeItem(parentself, idx, attachment, ...)

    if arg1 ~= "RightButton" or IsAltKeyDown() or IsShiftKeyDown() or IsControlKeyDown() then
        self.hooks["InboxFrame_OnClick"](parentself, idx, ...)
        return
    end

    local _, _, from, subject, money, cod, expires, hasitem, wasread, _, _, _ = GetInboxHeaderInfo(idx)

    local checked = this:GetChecked()
    local body, _, _, invoice = GetInboxText(idx)

    this:SetChecked(checked)

    if (not hasitem) and (money == 0) and (not wasread or (body and body ~= "")) then
        self.hooks["InboxFrame_OnClick"](parentself, idx, ...)
        return
    end

    if cod and cod > 0 then
        if cod > GetMoney() then
            StaticPopup_Show("COD_ALERT")
        else
            InboxFrame.openMailID = idx
            OpenMail_Update()
            ShowUIPanel(OpenMailFrame)
            PlaySound("igSpellBookOpen")
            StaticPopup_Show("COD_CONFIRMATION")
        end
        return
    end

    local took = ""
    if money > 0 then
        --took = abacus:FormatMoneyFull(money, true)
        took = JebusMail:getTextGSC(money)
        self.reccash.total = self.reccash.total + money
        if strfind(subject, L["Outbid"]) or strfind(subject, L["Auction cancelled"]) then
            self.reccash.refun = self.reccash.refun + money
        elseif strfind(subject, L["Auction successful"]) then
            self.reccash.sales = self.reccash.sales + money
        else
            self.reccash.other = self.reccash.other + money
        end
        TakeInboxMoney(idx)
    end

    if hasitem and money == 0 then
        -- name, texture, count, quality, canuse
        local name, _, count, quality = GetInboxItem(idx)
        TakeInboxItem(idx)
        -- r, g, b, hex
    end

    if not body or body == "" then
        _, _, _, _, money, _, _, hasitem = GetInboxHeaderInfo(idx)
        if not hasitem and money == 0 then
            DeleteInboxItem(idx)
        end
    end

    if took ~= "" then
        self:Print(L["Received %s from %s"]:format(took, from or L["UNKNOWN"]))
    end
end

function JebusMail:ReceiveMessage(prefix, sender, distribution, sFrom, sAttachment, iWaitTime, ...)
	table.insert(self.db.realm.mailLog, {
		to = UnitName("player"),
		from = sender,
		attachment = sAttachment,
		t = time() + iWaitTime
	})
	self:Print(L["%s sent to %s by %s is due in %d min."]:format(sAttachment, UnitName("player"), sender, iWaitTime / 60))
end
